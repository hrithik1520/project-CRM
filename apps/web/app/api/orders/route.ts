import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { createAuditLog, createLeadActivity } from '@/lib/api/audit'
import { parsePagination, paginatedResponse } from '@/lib/api/pagination'
import { z } from 'zod'

const createSchema = z.object({
  leadId: z.string().uuid(),
  contactId: z.string().uuid(),
  title: z.string().min(1).max(200),
  currency: z.string().length(3).default('INR'),
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
  })).min(1),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)

  const leadId = sp.get('leadId') ?? undefined
  const contactId = sp.get('contactId') ?? undefined
  const status = sp.get('status') ?? undefined

  const canViewAll = hasPermission(user.role, 'view_all_leads')

  const where: any = {
    ...(leadId && { leadId }),
    ...(contactId && { contactId }),
    ...(status && { status }),
    ...(!canViewAll && {
      lead: { assignedToId: user.id },
    }),
  }

  try {
    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          items: true,
          payments: true,
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.order.count({ where }),
    ])
    return ok(paginatedResponse(data, total, page, pageSize))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'create_lead')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const { items, ...rest } = body

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100)
      return sum + lineTotal
    }, 0)

    const order = await prisma.order.create({
      data: {
        ...rest,
        subtotal,
        total: subtotal,
        createdById: user.id,
        items: {
          create: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.quantity * item.unitPrice * (1 - item.discount / 100),
          })),
        },
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        items: true,
        payments: true,
      },
    })

    await createLeadActivity(body.leadId, user.id, 'order_created', `Order created: ${body.title}`, { orderId: order.id, total: subtotal })
    await createAuditLog({ userId: user.id, action: 'create', entityType: 'order', entityId: order.id, after: order })
    return created(order)
  } catch (err) {
    return serverError(err)
  }
}
