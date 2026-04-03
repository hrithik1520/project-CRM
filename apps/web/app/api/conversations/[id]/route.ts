import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, unauthorized, notFound, serverError } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/pagination'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take } = parsePagination(sp, 50)

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true } },
        whatsappAccount: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        },
      },
    })
    if (!conversation) return notFound('Conversation')
    return ok(conversation)
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: params.id } })
    if (!conversation) return notFound('Conversation')

    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: { unreadCount: 0 },
    })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}
