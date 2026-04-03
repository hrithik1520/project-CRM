import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const sessions = await prisma.whatsAppSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, name: true, phoneNumber: true, isActive: true } },
      },
    })
    return ok(sessions)
  } catch (err) {
    return serverError(err)
  }
}
