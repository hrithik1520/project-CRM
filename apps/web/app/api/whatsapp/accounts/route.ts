import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  phoneNumber: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const accounts = await prisma.whatsAppAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { conversations: true } },
      },
    })
    return ok(accounts)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_sessions')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const account = await prisma.whatsAppAccount.create({
      data: { ...body, createdById: user.id },
      include: { sessions: true },
    })
    return created(account)
  } catch (err) {
    return serverError(err)
  }
}
