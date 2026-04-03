import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, conflict, serverError } from '@/lib/api/response'
import { z } from 'zod'

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'manager', 'agent']).default('agent'),
})

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

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_users')) return forbidden()

  try {
    const body = inviteSchema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return conflict('Email already in use')

    const passwordHash = await hash(body.password, 10)
    const newUser = await prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash, role: body.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { assignedLeads: true } } },
    })
    return created(newUser)
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_users')) return forbidden()

  try {
    const { id, role } = await req.json()
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { assignedLeads: true } } },
    })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}
