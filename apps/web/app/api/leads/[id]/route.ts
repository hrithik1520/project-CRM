import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createAuditLog, createLeadActivity } from '@/lib/api/audit'
import { queueGA4Event } from '@/lib/ga4'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  stageId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'won', 'lost', 'stale', 'archived']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  source: z.string().optional(),
  lostReason: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        contact: true,
        pipeline: { select: { id: true, name: true } },
        stage: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        notes: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { id: true, name: true } } } },
        reminders: { orderBy: { dueAt: 'asc' }, include: { assignedTo: { select: { id: true, name: true } } } },
        tasks: { orderBy: { createdAt: 'desc' }, include: { assignedTo: { select: { id: true, name: true } } } },
        orders: { orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } },
        activity: { orderBy: { createdAt: 'desc' }, take: 50 },
        leadTags: { include: { tag: true } },
      },
    })
    if (!lead) return notFound('Lead')

    // Agents can only see their assigned leads
    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    return ok(lead)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && existing.assignedToId !== user.id) return forbidden()

    const body = updateSchema.parse(await req.json())
    const { tags, ...rest } = body

    // Detect stage change for activity log
    const stageChanged = rest.stageId && rest.stageId !== existing.stageId
    const assigneeChanged = 'assignedToId' in rest && rest.assignedToId !== existing.assignedToId

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        ...(stageChanged && { stageMovedAt: new Date() }),
        ...(rest.status === 'won' && { wonAt: new Date() }),
        ...(rest.status === 'lost' && { lostAt: new Date() }),
        ...(tags !== undefined && {
          leadTags: {
            deleteMany: {},
            create: await Promise.all(
              tags.map(async (name) => {
                const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
                return { tagId: tag.id }
              })
            ),
          },
        }),
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        stage: { select: { id: true, name: true, color: true } },
        assignedTo: { select: { id: true, name: true } },
        leadTags: { include: { tag: true } },
      },
    })

    // Activity log entries
    if (stageChanged) {
      const [fromStage, toStage] = await Promise.all([
        prisma.leadStage.findUnique({ where: { id: existing.stageId } }),
        prisma.leadStage.findUnique({ where: { id: rest.stageId! } }),
      ])
      await createLeadActivity(id, user.id, 'stage_moved', `Moved from ${fromStage?.name} → ${toStage?.name}`, { fromStageId: existing.stageId, toStageId: rest.stageId })
    }
    if (assigneeChanged && rest.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: rest.assignedToId }, select: { name: true } })
      await createLeadActivity(id, user.id, 'assigned', `Assigned to ${assignee?.name}`, { assignedToId: rest.assignedToId })
    }
    if (rest.status === 'won') {
      await createLeadActivity(id, user.id, 'status_changed', 'Lead marked as Won')
      await queueGA4Event('lead_won', { lead_id: id, pipeline_id: existing.pipelineId })
    }
    if (rest.status === 'lost') {
      await createLeadActivity(id, user.id, 'status_changed', `Lead marked as Lost${rest.lostReason ? `: ${rest.lostReason}` : ''}`)
      await queueGA4Event('lead_lost', { lead_id: id, pipeline_id: existing.pipelineId, reason: rest.lostReason ?? '' })
    }
    if (stageChanged) {
      await queueGA4Event('stage_moved', { lead_id: id, from_stage: existing.stageId, to_stage: rest.stageId! })
    }

    await createAuditLog({ userId: user.id, action: 'update', entityType: 'lead', entityId: id, before: existing, after: lead })
    return ok(lead)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'delete_lead')) return forbidden()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return notFound('Lead')
    // Soft delete — archive instead of hard delete
    await prisma.lead.update({ where: { id }, data: { status: 'archived' } })
    await createAuditLog({ userId: user.id, action: 'archive', entityType: 'lead', entityId: id })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
