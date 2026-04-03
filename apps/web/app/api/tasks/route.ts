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
  dueAt: z.string().datetime().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const status = sp.get('status') ?? undefined // todo | in_progress | done

  const canViewAll = hasPermission(user.role, 'view_all_leads')

  const where: any = {
    ...(!canViewAll && { assignedToId: user.id }),
    ...(status ? { status } : { status: { not: 'done' } }),
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        lead: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })
    return ok(tasks)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = createSchema.parse(await req.json())
    const task = await prisma.task.create({
      data: {
        title: body.title,
        priority: body.priority,
        ...(body.dueAt && { dueAt: new Date(body.dueAt) }),
        leadId: body.leadId,
        createdById: user.id,
        assignedToId: body.assignedToId ?? user.id,
      },
      include: {
        lead: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })
    await createLeadActivity(body.leadId, user.id, 'task_added', `Task added: ${body.title}`, { taskId: task.id })
    return created(task)
  } catch (err) {
    return serverError(err)
  }
}
