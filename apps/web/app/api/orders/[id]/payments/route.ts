import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createLeadActivity } from '@/lib/api/audit'
import { z } from 'zod'

const createSchema = z.object({
  amount: z.number().min(0.01),
  method: z.string().min(1).max(50),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().datetime().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    })
    if (!order) return notFound('Order')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll) {
      const lead = await prisma.lead.findUnique({ where: { id: order.leadId }, select: { assignedToId: true } })
      if (lead?.assignedToId !== user.id) return forbidden()
    }

    const body = createSchema.parse(await req.json())

    // Calculate new paid total
    const previouslyPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
    const newPaidTotal = previouslyPaid + body.amount

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId: id,
          amount: body.amount,
          method: body.method,
          reference: body.reference,
          note: body.note,
          paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
          recordedById: user.id,
        },
      }),
      // Update order paid amount and status
      prisma.order.update({
        where: { id },
        data: {
          paidAmount: newPaidTotal,
          status: newPaidTotal >= order.total ? 'delivered' : order.status,
        },
      }),
    ])

    await createLeadActivity(order.leadId, user.id, 'payment_received', `Payment received: ${body.amount} via ${body.method}`, { orderId: id, amount: body.amount })
    return created(payment)
  } catch (err) {
    return serverError(err)
  }
}
