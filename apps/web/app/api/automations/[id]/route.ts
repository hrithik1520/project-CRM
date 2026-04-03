import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  triggerType: z.string().optional(),
  triggerConfig: z.record(z.any()).optional(),
  conditions: z.array(z.any()).optional(),
  actionType: z.string().optional(),
  actionConfig: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  pipelineId: z.string().uuid().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_automations')) return forbidden()

  try {
    const exists = await prisma.automation.findUnique({ where: { id: params.id } })
    if (!exists) return notFound('Automation')

    const body = updateSchema.parse(await req.json())
    const automation = await prisma.automation.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
        ...(body.triggerConfig !== undefined && { triggerConfig: body.triggerConfig }),
        ...(body.conditions !== undefined && { conditions: body.conditions }),
        ...(body.actionType !== undefined && { actionType: body.actionType }),
        ...(body.actionConfig !== undefined && { actionConfig: body.actionConfig }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.pipelineId !== undefined && { pipelineId: body.pipelineId }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        pipeline: { select: { id: true, name: true } },
      },
    })
    return ok(automation)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_automations')) return forbidden()

  try {
    const exists = await prisma.automation.findUnique({ where: { id: params.id } })
    if (!exists) return notFound('Automation')
    await prisma.automation.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
