import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const canViewAll = hasPermission(user.role, 'view_all_leads')
  const leadFilter: any = canViewAll ? {} : { assignedToId: user.id }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    const [
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      newLeadsThisMonth,
      totalRevenue,
      revenueThisMonth,
      dueReminders,
      dueTasks,
      overdueReminders,
      whatsappSessions,
      recentActivity,
      pipelineSummary,
    ] = await Promise.all([
      // Lead counts
      prisma.lead.count({ where: { ...leadFilter } }),
      prisma.lead.count({ where: { ...leadFilter, status: 'active' } }),
      prisma.lead.count({ where: { ...leadFilter, status: 'won' } }),
      prisma.lead.count({ where: { ...leadFilter, status: 'lost' } }),
      prisma.lead.count({ where: { ...leadFilter, createdAt: { gte: startOfMonth } } }),

      // Revenue (from delivered orders)
      prisma.order.aggregate({
        where: { status: 'delivered', ...(canViewAll ? {} : { lead: { assignedToId: user.id } }) },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          createdAt: { gte: startOfMonth },
          ...(canViewAll ? {} : { lead: { assignedToId: user.id } }),
        },
        _sum: { total: true },
      }),

      // Due today
      prisma.reminder.count({
        where: {
          isDone: false,
          dueAt: { gte: startOfDay, lt: endOfDay },
          ...(!canViewAll && { assignedToId: user.id }),
        },
      }),
      prisma.task.count({
        where: {
          status: { not: 'done' },
          dueAt: { gte: startOfDay, lt: endOfDay },
          ...(!canViewAll && { assignedToId: user.id }),
        },
      }),

      // Overdue
      prisma.reminder.count({
        where: {
          isDone: false,
          dueAt: { lt: startOfDay },
          ...(!canViewAll && { assignedToId: user.id }),
        },
      }),

      // WhatsApp sessions
      prisma.whatsAppSession.findMany({
        select: { id: true, status: true, account: { select: { id: true, name: true, phoneNumber: true } } },
      }),

      // Recent activity
      prisma.leadActivity.findMany({
        where: canViewAll ? {} : { lead: { assignedToId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lead: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
      }),

      // Pipeline summary (active leads per stage)
      prisma.leadStage.findMany({
        include: {
          pipeline: { select: { id: true, name: true } },
          _count: {
            select: {
              leads: { where: { status: 'active', ...leadFilter } },
            },
          },
        },
        orderBy: [{ pipeline: { isDefault: 'desc' } }, { position: 'asc' }],
      }),
    ])

    return ok({
      leads: {
        total: totalLeads,
        active: activeLeads,
        won: wonLeads,
        lost: lostLeads,
        newThisMonth: newLeadsThisMonth,
      },
      revenue: {
        total: totalRevenue._sum.total ?? 0,
        thisMonth: revenueThisMonth._sum.total ?? 0,
      },
      dueToday: {
        reminders: dueReminders,
        tasks: dueTasks,
      },
      overdue: {
        reminders: overdueReminders,
      },
      whatsappSessions,
      recentActivity,
      pipelineSummary,
    })
  } catch (err) {
    return serverError(err)
  }
}
