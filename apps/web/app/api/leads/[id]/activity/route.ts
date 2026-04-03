import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } })
    if (!lead) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    const take = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100)

    const activity = await prisma.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { id: true, name: true } } },
    })
    return ok(activity)
  } catch (err) {
    return serverError(err)
  }
}
