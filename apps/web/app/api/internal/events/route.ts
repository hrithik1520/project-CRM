import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { ok, unauthorized, serverError } from '@/lib/api/response'
import type { InternalEvent } from '@crm/types'

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

export async function POST(req: NextRequest) {
  // Validate internal secret
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${INTERNAL_SECRET}`) {
    return unauthorized()
  }

  try {
    const event = (await req.json()) as InternalEvent

    if (event.type === 'session_status') {
      // Update session status in DB
      await prisma.whatsAppSession.updateMany({
        where: { id: event.sessionId },
        data: {
          status: event.status as any,
          qrCode: event.status === 'qr' ? event.qrCode : null,
          qrExpiresAt: event.status === 'qr' ? new Date(Date.now() + 60_000) : null,
          lastConnectedAt: event.status === 'connected' ? new Date() : undefined,
          errorMessage: event.errorMessage ?? null,
        },
      })

      // Update phone number on account if connected
      if (event.status === 'connected' && event.phoneNumber) {
        await prisma.whatsAppSession.findFirst({ where: { id: event.sessionId } }).then(async (session) => {
          if (session) {
            await prisma.whatsAppAccount.update({
              where: { id: session.accountId },
              data: { phoneNumber: event.phoneNumber },
            })
          }
        })
      }
    }

    if (event.type === 'message_received') {
      const phone = '+' + event.from.replace(/^\+/, '')

      // Find or create contact
      let contact = await prisma.contact.findUnique({ where: { phone } })
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            phone,
            name: phone, // Will be updated when we get contact info
            source: 'whatsapp',
            createdById: (await prisma.user.findFirst({ where: { role: 'admin' } }))?.id ?? '',
          },
        })
      }

      // Find whatsapp account from session
      const session = await prisma.whatsAppSession.findFirst({
        where: { id: event.sessionId },
        select: { accountId: true },
      })
      if (!session) return ok({ ok: true })

      // Find or create conversation
      let conversation = await prisma.conversation.findUnique({
        where: { contactId_whatsappAccountId: { contactId: contact.id, whatsappAccountId: session.accountId } },
      })
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { contactId: contact.id, whatsappAccountId: session.accountId },
        })
      }

      // Save message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'inbound',
          body: event.body,
          type: event.messageType as any,
          status: 'delivered',
          waMessageId: event.waMessageId,
          sentAt: new Date(event.timestamp * 1000),
        },
      })

      // Update conversation last message
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(event.timestamp * 1000),
          lastMessageBody: event.body?.slice(0, 200),
          unreadCount: { increment: 1 },
        },
      })
    }

    return ok({ ok: true })
  } catch (err) {
    return serverError(err)
  }
}
