import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_webhooks')) return forbidden()

  const { id } = await params
  try {
    const { isActive } = await req.json()
    const webhook = await prisma.webhook.update({ where: { id }, data: { isActive } })
    return ok(webhook)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_webhooks')) return forbidden()

  const { id } = await params
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id } })
    if (!webhook) return notFound('Webhook')
    await prisma.webhook.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
