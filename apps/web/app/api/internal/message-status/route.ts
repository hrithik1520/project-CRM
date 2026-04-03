import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { ok, unauthorized, serverError } from '@/lib/api/response'

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth || auth !== `Bearer ${INTERNAL_SECRET}`) return unauthorized()

  try {
    const { messageId, status, waMessageId, error } = await req.json() as {
      messageId: string
      status: 'sent' | 'failed'
      waMessageId?: string
      error?: string
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: status as any,
        waMessageId: waMessageId ?? undefined,
        sentAt: status === 'sent' ? new Date() : undefined,
        failureReason: error ?? null,
      },
    })

    return ok({ ok: true })
  } catch (err) {
    return serverError(err)
  }
}
