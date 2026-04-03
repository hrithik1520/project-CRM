import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { created, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const ENGINE_URL = process.env.WHATSAPP_ENGINE_URL ?? 'http://localhost:3001'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

const sendSchema = z.object({
  body: z.string().min(1),
  type: z.enum(['text', 'image', 'document', 'audio', 'video', 'template']).default('text'),
  templateId: z.string().uuid().optional(),
  mediaUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'send_message')) return forbidden()

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        whatsappAccount: {
          include: { sessions: { where: { status: 'connected' }, take: 1 } },
        },
        contact: { select: { phone: true } },
      },
    })
    if (!conversation) return notFound('Conversation')

    const body = sendSchema.parse(await req.json())

    // Save message with queued status initially
    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        direction: 'outbound',
        body: body.body,
        type: body.type,
        status: 'queued',
        templateId: body.templateId ?? null,
        mediaUrl: body.mediaUrl ?? null,
      },
    })

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date(), lastMessageBody: body.body },
    })

    // Try to send via WhatsApp engine
    const session = conversation.whatsappAccount.sessions[0]
    if (session) {
      try {
        const res = await fetch(`${ENGINE_URL}/sessions/${session.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${INTERNAL_SECRET}`,
          },
          body: JSON.stringify({
            to: conversation.contact.phone,
            message: body.body,
            type: body.type,
            mediaUrl: body.mediaUrl,
          }),
          signal: AbortSignal.timeout(5000),
        })

        if (res.ok) {
          const data = await res.json()
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'sent', sentAt: new Date(), waMessageId: data.waMessageId ?? null },
          })
        }
      } catch {
        // Engine unreachable — message stays as 'queued' (will be picked up by worker)
      }
    }

    return created(message)
  } catch (err) {
    return serverError(err)
  }
}
