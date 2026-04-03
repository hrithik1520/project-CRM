import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createLeadActivity } from '@/lib/api/audit'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime(),
  assignedToId: z.string().uuid().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } })
    if (!lead) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    const reminders = await prisma.reminder.findMany({
      where: { leadId: id },
      orderBy: { dueAt: 'asc' },
      include: { assignedTo: { select: { id: true, name: true } } },
    })
    return ok(reminders)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } })
    if (!lead) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    const body = createSchema.parse(await req.json())
    const reminder = await prisma.reminder.create({
      data: {
        ...body,
        dueAt: new Date(body.dueAt),
        leadId: id,
        createdById: user.id,
        assignedToId: body.assignedToId ?? user.id,
      },
      include: { assignedTo: { select: { id: true, name: true } } },
    })

    await createLeadActivity(id, user.id, 'reminder_set', `Reminder set: ${body.title}`, { reminderId: reminder.id, dueAt: body.dueAt })
    return created(reminder)
  } catch (err) {
    return serverError(err)
  }
}
