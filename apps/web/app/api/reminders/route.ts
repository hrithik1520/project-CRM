import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, serverError } from '@/lib/api/response'

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
