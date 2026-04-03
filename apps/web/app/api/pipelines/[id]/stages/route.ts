import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const stageSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
})

const reorderSchema = z.object({
  stages: z.array(z.object({ id: z.string(), position: z.number() })),
})

type Params = { params: Promise<{ id: string }> }

// POST /api/pipelines/:id/stages — create stage
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_pipelines')) return forbidden()
  const { id: pipelineId } = await params

  try {
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } })
    if (!pipeline) return notFound('Pipeline')

    const body = stageSchema.parse(await req.json())
    const maxPos = await prisma.leadStage.aggregate({ where: { pipelineId }, _max: { position: true } })

    const stage = await prisma.leadStage.create({
      data: { ...body, pipelineId, position: (maxPos._max.position ?? 0) + 1 },
    })
    return created(stage)
  } catch (err) {
    return serverError(err)
  }
}

// PUT /api/pipelines/:id/stages — reorder all stages
export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_pipelines')) return forbidden()
  const { id: pipelineId } = await params

  try {
    const { stages } = reorderSchema.parse(await req.json())
    await prisma.$transaction(
      stages.map((s) =>
        prisma.leadStage.update({ where: { id: s.id, pipelineId }, data: { position: s.position } })
      )
    )
    const updated = await prisma.leadStage.findMany({ where: { pipelineId }, orderBy: { position: 'asc' } })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}
