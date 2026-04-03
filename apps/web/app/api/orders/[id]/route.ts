import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createAuditLog, createLeadActivity } from '@/lib/api/audit'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).optional(),
  title: z.string().min(1).max(200).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        lead: { select: { id: true, title: true } },
        items: true,
        payments: true,
        createdBy: { select: { id: true, name: true } },
      },
    })
    if (!order) return notFound('Order')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll) {
      const lead = await prisma.lead.findUnique({ where: { id: order.leadId }, select: { assignedToId: true } })
      if (lead?.assignedToId !== user.id) return forbidden()
    }

    return ok(order)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return notFound('Order')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll) {
      const lead = await prisma.lead.findUnique({ where: { id: existing.leadId }, select: { assignedToId: true } })
      if (lead?.assignedToId !== user.id) return forbidden()
    }

    const body = updateSchema.parse(await req.json())
    const order = await prisma.order.update({
      where: { id },
      data: body,
      include: { items: true, payments: true },
    })

    if (body.status && body.status !== existing.status) {
      await createLeadActivity(existing.leadId, user.id, 'order_updated', `Order status: ${body.status}`, { orderId: id })
    }
    await createAuditLog({ userId: user.id, action: 'update', entityType: 'order', entityId: id, before: existing, after: order })
    return ok(order)
  } catch (err) {
    return serverError(err)
  }
}
