import { NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'

const ENGINE_URL = process.env.WHATSAPP_ENGINE_URL ?? 'http://localhost:3001'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

async function proxyToEngine(path: string, method = 'POST', body?: object) {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INTERNAL_SECRET}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const action = req.nextUrl.searchParams.get('action')

  try {
    const session = await prisma.whatsAppSession.findUnique({
      where: { id: params.id },
      include: { account: { select: { id: true, name: true, phoneNumber: true } } },
    })
    if (!session) return notFound('Session')

    if (action === 'qr') {
      // Try to get fresh QR from engine
      let rawQR: string | null = null
      let qrExpiresAt: Date | null = null
      try {
        const res = await proxyToEngine(`/sessions/${params.id}/status`, 'GET')
        if (res.ok) {
          const data = await res.json()
          if (data.qr?.qr) {
            rawQR = data.qr.qr
            qrExpiresAt = data.qr.expiresAt ? new Date(data.qr.expiresAt) : null
          }
        }
      } catch {
        // Engine not available, fall back to stored QR
      }
      // Fall back to stored QR
      if (!rawQR && session.qrCode) {
        rawQR = session.qrCode
        qrExpiresAt = session.qrExpiresAt
      }
      // Re-fetch current status from DB (may have been updated by internal event)
      const freshSession = await prisma.whatsAppSession.findUnique({ where: { id: params.id } })
      const currentStatus = freshSession?.status ?? session.status

      if (!rawQR) return ok({ qrDataUrl: null, qrExpiresAt: null, status: currentStatus })
      // Convert raw QR string to data URL (PNG)
      const qrDataUrl = await QRCode.toDataURL(rawQR, { width: 300, margin: 2 })
      return ok({ qrDataUrl, qrExpiresAt, status: currentStatus })
    }

    return ok(session)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_sessions')) return forbidden()

  const action = req.nextUrl.searchParams.get('action')
  if (!action || !['start', 'stop', 'logout'].includes(action)) {
    return badRequest('Invalid action. Must be start, stop, or logout')
  }

  try {
    const session = await prisma.whatsAppSession.findUnique({ where: { id: params.id } })
    if (!session) return notFound('Session')

    // Proxy to WhatsApp engine
    try {
      const engineBody = action === 'start' ? { accountId: session.accountId } : undefined
      const res = await proxyToEngine(`/sessions/${params.id}/${action}`, 'POST', engineBody)
      if (res.ok) {
        const data = await res.json()
        // Update status in DB
        const newStatus = action === 'start' ? 'initializing' : action === 'stop' ? 'stopped' : 'disconnected'
        await prisma.whatsAppSession.update({
          where: { id: params.id },
          data: { status: newStatus as any },
        })
        return ok(data)
      }
    } catch {
      // Engine unreachable — update DB status only
    }

    const newStatus = action === 'start' ? 'initializing' : action === 'stop' ? 'stopped' : 'disconnected'
    const updated = await prisma.whatsAppSession.update({
      where: { id: params.id },
      data: { status: newStatus as any },
    })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}
