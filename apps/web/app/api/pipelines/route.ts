import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { createAuditLog } from '@/lib/api/audit'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function GET() {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: { orderBy: { position: 'asc' } },
        _count: { select: { leads: { where: { status: 'active' } } } },
      },
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
    })
    return ok(pipelines)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_pipelines')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const maxPos = await prisma.pipeline.aggregate({ _max: { position: true } })
    const pipeline = await prisma.pipeline.create({
      data: {
        ...body,
        position: (maxPos._max.position ?? 0) + 1,
        createdById: user.id,
      },
      include: { stages: true },
    })
    await createAuditLog({ userId: user.id, action: 'create', entityType: 'pipeline', entityId: pipeline.id, after: pipeline })
    return created(pipeline)
  } catch (err) {
    return serverError(err)
  }
}
