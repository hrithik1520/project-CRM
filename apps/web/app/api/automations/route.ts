import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  triggerType: z.string().min(1),
  triggerConfig: z.record(z.any()).optional(),
  conditions: z.array(z.any()).optional(),
  actionType: z.string().min(1),
  actionConfig: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  pipelineId: z.string().uuid().optional().nullable(),
})

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        pipeline: { select: { id: true, name: true } },
        _count: { select: { runs: true } },
      },
    })
    return ok(automations)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_automations')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const automation = await prisma.automation.create({
      data: {
        name: body.name,
        description: body.description,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig ?? {},
        conditions: body.conditions ?? [],
        actionType: body.actionType,
        actionConfig: body.actionConfig ?? {},
        isActive: body.isActive,
        pipelineId: body.pipelineId ?? null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        pipeline: { select: { id: true, name: true } },
      },
    })
    return created(automation)
  } catch (err) {
    return serverError(err)
  }
}
