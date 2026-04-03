import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, serverError } from '@/lib/api/response'
import { createLeadActivity } from '@/lib/api/audit'
import { z } from 'zod'

const createSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime(),
  assignedToId: z.string().uuid().optional(),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const filter = sp.get('filter') ?? 'upcoming' // today | overdue | upcoming | done

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)

  const canViewAll = hasPermission(user.role, 'view_all_leads')

  const baseWhere: any = {
    ...(!canViewAll && { assignedToId: user.id }),
  }

  const dateFilter: any =
    filter === 'today'
      ? { dueAt: { gte: startOfDay, lt: endOfDay }, isDone: false }
      : filter === 'overdue'
      ? { dueAt: { lt: startOfDay }, isDone: false }
      : filter === 'done'
      ? { isDone: true }
      : { dueAt: { gte: endOfDay }, isDone: false }

  try {
    const reminders = await prisma.reminder.findMany({
      where: { ...baseWhere, ...dateFilter },
      orderBy: { dueAt: 'asc' },
      include: {
        lead: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })
    return ok(reminders)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = createSchema.parse(await req.json())
    const reminder = await prisma.reminder.create({
      data: {
        title: body.title,
        dueAt: new Date(body.dueAt),
        leadId: body.leadId,
        createdById: user.id,
        assignedToId: body.assignedToId ?? user.id,
      },
      include: {
        lead: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })
    await createLeadActivity(body.leadId, user.id, 'reminder_set', `Reminder set: ${body.title}`, { reminderId: reminder.id })
    return created(reminder)
  } catch (err) {
    return serverError(err)
  }
}
