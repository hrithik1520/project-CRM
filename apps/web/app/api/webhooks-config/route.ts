import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_webhooks')) return forbidden()

  try {
    const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } })
    return ok(webhooks)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_webhooks')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const secret = randomBytes(24).toString('hex')
    const webhook = await prisma.webhook.create({ data: { name: body.name, secret } })
    return created(webhook)
  } catch (err) {
    return serverError(err)
  }
}
