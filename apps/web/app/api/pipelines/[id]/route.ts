import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createAuditLog } from '@/lib/api/audit'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { position: 'asc' } } },
    })
    if (!pipeline) return notFound('Pipeline')
    return ok(pipeline)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_pipelines')) return forbidden()
  const { id } = await params

  try {
    const body = updateSchema.parse(await req.json())
    const existing = await prisma.pipeline.findUnique({ where: { id } })
    if (!existing) return notFound('Pipeline')

    const pipeline = await prisma.pipeline.update({ where: { id }, data: body })
    await createAuditLog({ userId: user.id, action: 'update', entityType: 'pipeline', entityId: id, before: existing, after: pipeline })
    return ok(pipeline)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_pipelines')) return forbidden()
  const { id } = await params

  try {
    const pipeline = await prisma.pipeline.findUnique({ where: { id } })
    if (!pipeline) return notFound('Pipeline')
    if (pipeline.isDefault) return forbidden()

    await prisma.pipeline.delete({ where: { id } })
    await createAuditLog({ userId: user.id, action: 'delete', entityType: 'pipeline', entityId: id, before: pipeline })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
