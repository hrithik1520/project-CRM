import { Client, LocalAuth, Message } from 'whatsapp-web.js'
import path from 'path'
import { postInternalEvent } from '../store/event-poster'
import type { WhatsAppSessionStatus, MessageType } from '@crm/types'

const SESSIONS_DIR = process.env.SESSIONS_DIR ?? path.join(process.cwd(), 'whatsapp-sessions')

interface SessionEntry {
  client: Client
  status: WhatsAppSessionStatus
  lastQR: string | null
  qrExpiresAt: Date | null
  phoneNumber: string | null
}

class SessionManager {
  private sessions = new Map<string, SessionEntry>()

  async startSession(sessionId: string, accountId: string): Promise<void> {
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!
      if (existing.status === 'connected') return
      // Destroy existing client before recreating
      await existing.client.destroy().catch(() => null)
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: SESSIONS_DIR,
      }),
      puppeteer: {
        headless: true,
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
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1015901307-alpha.html',
      },
    })

    const entry: SessionEntry = {
      client,
      status: 'initializing',
      lastQR: null,
      qrExpiresAt: null,
      phoneNumber: null,
    }
    this.sessions.set(sessionId, entry)

    // ── QR event ──────────────────────────────────────────
    client.on('qr', async (qr) => {
      entry.status = 'qr'
      entry.lastQR = qr
      entry.qrExpiresAt = new Date(Date.now() + 60_000)
      await postInternalEvent({
        type: 'session_status',
        sessionId,
        accountId,
        status: 'qr',
        qrCode: qr,
      })
    })

    // ── Ready event ────────────────────────────────────────
    client.on('ready', async () => {
      const info = client.info
      entry.status = 'connected'
      entry.lastQR = null
      entry.phoneNumber = info?.wid?.user ?? null
      await postInternalEvent({
        type: 'session_status',
        sessionId,
        accountId,
        status: 'connected',
        phoneNumber: entry.phoneNumber ?? undefined,
      })
      console.log(`[session:${sessionId}] Connected — ${entry.phoneNumber}`)
    })

    // ── Disconnect event ───────────────────────────────────
    client.on('disconnected', async (reason) => {
      console.log(`[session:${sessionId}] Disconnected: ${reason}`)
      entry.status = 'disconnected'
      await postInternalEvent({
        type: 'session_status',
        sessionId,
        accountId,
        status: 'disconnected',
      })
      // Auto-reconnect after 30s unless it was a deliberate logout
      if (reason !== 'LOGOUT') {
        setTimeout(() => this.startSession(sessionId, accountId), 30_000)
      }
    })

    // ── Incoming message ───────────────────────────────────
    client.on('message', async (msg: Message) => {
      try {
        const type = msg.type as MessageType
        await postInternalEvent({
          type: 'message_received',
          sessionId,
          accountId,
          waMessageId: msg.id.id,
          from: msg.from.replace('@c.us', ''),
          body: msg.body ?? null,
          messageType: type,
          timestamp: msg.timestamp,
        })
      } catch (err) {
        console.error(`[session:${sessionId}] Error handling incoming message:`, err)
      }
    })

    // ── Auth failure ───────────────────────────────────────
    client.on('auth_failure', async (msg) => {
      console.error(`[session:${sessionId}] Auth failure: ${msg}`)
      entry.status = 'requires_reauth'
      await postInternalEvent({
        type: 'session_status',
        sessionId,
        accountId,
        status: 'requires_reauth',
        errorMessage: String(msg),
      })
    })

    await client.initialize()
  }

  async stopSession(sessionId: string): Promise<void> {
    const entry = this.sessions.get(sessionId)
    if (!entry) return
    await entry.client.destroy().catch(() => null)
    entry.status = 'stopped'
    this.sessions.delete(sessionId)
  }

  async logoutSession(sessionId: string, accountId: string): Promise<void> {
    const entry = this.sessions.get(sessionId)
    if (!entry) return
    await entry.client.logout().catch(() => null)
    await entry.client.destroy().catch(() => null)
    this.sessions.delete(sessionId)
    await postInternalEvent({
      type: 'session_status',
      sessionId,
      accountId,
      status: 'stopped',
    })
  }

  async sendMessage(sessionId: string, to: string, body: string): Promise<string> {
    const entry = this.sessions.get(sessionId)
    if (!entry || entry.status !== 'connected') {
      throw new Error(`Session ${sessionId} is not connected`)
    }
    // WhatsApp requires number in format: {countrycode}{number}@c.us
    const chatId = to.replace(/^\+/, '').replace(/\D/g, '') + '@c.us'
    const msg = await entry.client.sendMessage(chatId, body)
    return msg.id.id
  }

  getStatus(sessionId: string): WhatsAppSessionStatus | null {
    return this.sessions.get(sessionId)?.status ?? null
  }

  getQR(sessionId: string): { qr: string; expiresAt: Date } | null {
    const entry = this.sessions.get(sessionId)
    if (!entry || !entry.lastQR || !entry.qrExpiresAt) return null
    return { qr: entry.lastQR, expiresAt: entry.qrExpiresAt }
  }

  getAllStatuses(): Array<{ sessionId: string; status: WhatsAppSessionStatus; phoneNumber: string | null }> {
    return Array.from(this.sessions.entries()).map(([id, e]) => ({
      sessionId: id,
      status: e.status,
      phoneNumber: e.phoneNumber,
    }))
  }
}

export const sessionManager = new SessionManager()
