import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, serverError } from '@/lib/api/response'

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
