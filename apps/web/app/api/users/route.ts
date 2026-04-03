import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api/response'

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  // Agents can't view team list (they only need to see themselves)
  if (!hasPermission(user.role, 'view_all_leads')) return forbidden()

  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { assignedLeads: { where: { status: 'active' } } } },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })
    return ok(users)
  } catch (err) {
    return serverError(err)
  }
}
