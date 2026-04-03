'use strict'

/**
 * WhatsAppManager
 *
 * Manages multiple WhatsApp accounts via whatsapp-web.js.
 * Each account gets its own Puppeteer-backed Client with LocalAuth persistence.
 *
 * Usage:
 *   const { WhatsAppManager } = require('./manager')
 *   const manager = new WhatsAppManager(io)           // io = Socket.IO Server instance
 *   await manager.restoreConnectedAccounts()           // call once on server start
 *   await manager.addAccount(accountId, accountLabel)  // call when user adds a new number
 *
 * Socket.IO events emitted:
 *   wa:qr          { accountId, qr }
 *   wa:ready       { accountId, phoneNumber }
 *   wa:disconnected { accountId, reason }
 *   wa:message     { accountId, from, body, type, waMessageId, conversationId, messageId, timestamp }
 */

const { Client, LocalAuth } = require('whatsapp-web.js')
const { PrismaClient } = require('@prisma/client')
const path = require('path')

const prisma = new PrismaClient()

const SESSIONS_DIR =
  process.env.SESSIONS_DIR ?? path.join(process.cwd(), 'whatsapp-sessions')

const PUPPETEER_EXECUTABLE =
  process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/google-chrome'

const WA_WEB_VERSION_URL =
  'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1015901307-alpha.html'

// ─────────────────────────────────────────────────────────────────────────────

class WhatsAppManager {
  /**
   * @param {import('socket.io').Server} io  Socket.IO server to broadcast events on
   */
  constructor(io) {
    /** @type {import('socket.io').Server} */
    this.io = io

    /**
     * Map of accountId → { client, status, label, phoneNumber }
     * @type {Map<string, { client: Client, status: string, label: string, phoneNumber: string | null }>}
     */
    this.clients = new Map()
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Add (or re-initialise) a WhatsApp account.
   * Non-blocking: client.initialize() starts Puppeteer in the background.
   * @param {string} accountId   UUID of the WhatsAppAccount row
   * @param {string} accountLabel  Human-readable name shown in logs
   */
  async addAccount(accountId, accountLabel) {
    // If already connected, skip silently
    const existing = this.clients.get(accountId)
    if (existing?.status === 'connected') {
      console.log(`[WA] ${accountLabel} already connected — skipping`)
      return
    }
    // Clean up any stale client before rebuilding
    if (existing) {
      await existing.client.destroy().catch(() => null)
      this.clients.delete(accountId)
    }

    console.log(`[WA] Initialising account: ${accountLabel} (${accountId})`)

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: accountId,
        dataPath: SESSIONS_DIR,
      }),
      puppeteer: {
        headless: true,
        executablePath: PUPPETEER_EXECUTABLE,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
      webVersionCache: {
        type: 'remote',
        remotePath: WA_WEB_VERSION_URL,
      },
    })

    const entry = { client, status: 'initializing', label: accountLabel, phoneNumber: null }
    this.clients.set(accountId, entry)

    // ── QR ─────────────────────────────────────────────────────────────────
    client.on('qr', async (qr) => {
      entry.status = 'qr'
      console.log(`[WA] QR ready for ${accountLabel}`)

      await this._setSessionStatus(accountId, 'qr', {
        qrCode: qr,
        qrExpiresAt: new Date(Date.now() + 60_000),
      })

      this.io.emit('wa:qr', { accountId, qr })
    })

    // ── Ready ───────────────────────────────────────────────────────────────
    client.on('ready', async () => {
      const phoneNumber = client.info?.wid?.user ?? null
      entry.status = 'connected'
      entry.phoneNumber = phoneNumber
      console.log(`[WA] ${accountLabel} connected — ${phoneNumber}`)

      await this._setSessionStatus(accountId, 'connected', {
        qrCode: null,
        qrExpiresAt: null,
        lastConnectedAt: new Date(),
        errorMessage: null,
      })

      // Persist phone number on the account row
      if (phoneNumber) {
        await prisma.whatsAppAccount
          .update({ where: { id: accountId }, data: { phoneNumber } })
          .catch((err) => console.error('[WA] Failed to update phone number:', err))
      }

      this.io.emit('wa:ready', { accountId, phoneNumber })
    })

    // ── Disconnected ────────────────────────────────────────────────────────
    client.on('disconnected', async (reason) => {
      console.log(`[WA] ${accountLabel} disconnected: ${reason}`)
      entry.status = 'disconnected'

      await this._setSessionStatus(accountId, 'disconnected')
      this.io.emit('wa:disconnected', { accountId, reason })

      // Auto-reconnect after 30 s unless the user deliberately logged out
      if (reason !== 'LOGOUT') {
        console.log(`[WA] Scheduling reconnect for ${accountLabel} in 30 s`)
        setTimeout(() => this.addAccount(accountId, accountLabel), 30_000)
      }
    })

    // ── Auth failure ────────────────────────────────────────────────────────
    client.on('auth_failure', async (msg) => {
      console.error(`[WA] Auth failure for ${accountLabel}: ${msg}`)
      entry.status = 'requires_reauth'

      await this._setSessionStatus(accountId, 'requires_reauth', {
        errorMessage: String(msg),
      })
      this.io.emit('wa:disconnected', { accountId, reason: 'auth_failure' })
    })

    // ── Incoming message ────────────────────────────────────────────────────
    client.on('message', async (msg) => {
      try {
        const from = msg.from.replace('@c.us', '')
        const saved = await this._persistIncomingMessage(accountId, from, msg)

        this.io.emit('wa:message', {
          accountId,
          from,
          body: msg.body ?? null,
          type: msg.type ?? 'text',
          waMessageId: msg.id.id,
          conversationId: saved?.conversationId ?? null,
          messageId: saved?.id ?? null,
          timestamp: msg.timestamp,
        })
      } catch (err) {
        console.error(`[WA] Error persisting incoming message for ${accountLabel}:`, err)
      }
    })

    // Initialize (non-blocking — events above drive all state changes)
    client.initialize().catch((err) => {
      console.error(`[WA] client.initialize() failed for ${accountLabel}:`, err)
      entry.status = 'disconnected'
    })
  }

  /**
   * Send a plain-text message.
   * @param {string} accountId
   * @param {string} to  Phone number — e.g. "+919876543210" or "919876543210"
   * @param {string} body
   * @returns {Promise<string>} WhatsApp message ID
   */
  async sendMessage(accountId, to, body) {
    const entry = this._requireConnected(accountId)
    const chatId = to.replace(/^\+/, '').replace(/\D/g, '') + '@c.us'
    const msg = await entry.client.sendMessage(chatId, body)
    return msg.id.id
  }

  /**
   * Fetch a template, substitute {{variable}} placeholders, then send.
   * @param {string} accountId
   * @param {string} to
   * @param {string} templateId  UUID of MessageTemplate row
   * @param {Record<string, string>} variables  e.g. { name: 'Ravi', amount: '5000' }
   * @returns {Promise<{ waMessageId: string, body: string }>}
   */
  async sendTemplate(accountId, to, templateId, variables = {}) {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new Error(`Template not found: ${templateId}`)

    // Replace every {{key}} — unknown keys are left as-is
    const body = template.body.replace(/\{\{(\w+)\}\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
    )

    const waMessageId = await this.sendMessage(accountId, to, body)
    return { waMessageId, body }
  }

  /**
   * Return the current status string for an account, or null if unknown.
   * @param {string} accountId
   * @returns {string | null}
   */
  getStatus(accountId) {
    return this.clients.get(accountId)?.status ?? null
  }

  /**
   * Re-initialise all sessions whose DB status is 'connected'.
   * Call once after the Socket.IO server is ready.
   */
  async restoreConnectedAccounts() {
    const sessions = await prisma.whatsAppSession.findMany({
      where: { status: 'connected' },
      include: { account: { select: { id: true, name: true } } },
    })

    if (sessions.length === 0) {
      console.log('[WA] No sessions to restore')
      return
    }

    console.log(`[WA] Restoring ${sessions.length} session(s)…`)

    // Re-initialise sequentially to avoid hammering Puppeteer at boot
    for (const session of sessions) {
      await this.addAccount(session.account.id, session.account.name).catch((err) =>
        console.error(`[WA] Failed to restore ${session.account.name}:`, err)
      )
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * @param {string} accountId
   * @returns {{ client: Client, status: string }}
   */
  _requireConnected(accountId) {
    const entry = this.clients.get(accountId)
    if (!entry || entry.status !== 'connected') {
      throw new Error(`Account ${accountId} is not connected (status: ${entry?.status ?? 'unknown'})`)
    }
    return entry
  }

  /**
   * Update whatsapp_sessions rows that belong to accountId.
   * @param {string} accountId
   * @param {string} status
   * @param {object} extra  Additional fields to merge into the update payload
   */
  async _setSessionStatus(accountId, status, extra = {}) {
    await prisma.whatsAppSession.updateMany({
      where: { accountId },
      data: { status, ...extra },
    })
  }

  /**
   * Upsert contact → conversation → message for an inbound WhatsApp message.
   * Returns the created Message row, or null if a system admin user cannot be found.
   * @param {string} accountId
   * @param {string} fromPhone  E.g. "919876543210"
   * @param {object} msg  whatsapp-web.js Message object
   * @returns {Promise<import('@prisma/client').Message | null>}
   */
  async _persistIncomingMessage(accountId, fromPhone, msg) {
    // ── 1. Find or create contact ──────────────────────────────────────────
    let contact = await prisma.contact.findFirst({ where: { phone: fromPhone } })

    if (!contact) {
      // New contacts need a createdById — use the first admin as system actor
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
      if (!admin) {
        console.warn('[WA] Cannot create contact — no admin user found')
        return null
      }
      contact = await prisma.contact.create({
        data: {
          name: fromPhone,          // placeholder; agent can edit later
          phone: fromPhone,
          source: 'whatsapp',
          createdById: admin.id,
        },
      })
    }

    // ── 2. Find or create conversation ─────────────────────────────────────
    let conversation = await prisma.conversation.findUnique({
      where: {
        contactId_whatsappAccountId: {
          contactId: contact.id,
          whatsappAccountId: accountId,
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          whatsappAccountId: accountId,
          lastMessageAt: new Date(),
          lastMessageBody: msg.body ?? '',
          unreadCount: 1,
        },
      })
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          lastMessageBody: msg.body ?? '',
          unreadCount: { increment: 1 },
        },
      })
    }

    // ── 3. Create message row ──────────────────────────────────────────────
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        body: msg.body ?? null,
        type: _normaliseMessageType(msg.type),
        status: 'delivered',
        waMessageId: msg.id.id,
        sentAt: new Date(msg.timestamp * 1000),
      },
    })

    return message
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

const VALID_MESSAGE_TYPES = new Set([
  'text', 'image', 'document', 'audio', 'video', 'sticker', 'location', 'template',
])

/**
 * whatsapp-web.js can return types like 'chat', 'ptt', etc. that don't exist in
 * our MessageType enum — map them to safe fallbacks.
 * @param {string | undefined} type
 * @returns {string}
 */
function _normaliseMessageType(type) {
  if (!type) return 'text'
  if (VALID_MESSAGE_TYPES.has(type)) return type
  if (type === 'ptt') return 'audio'        // voice note
  if (type === 'chat') return 'text'
  return 'text'
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { WhatsAppManager }
