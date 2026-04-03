import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { createAuditLog, createLeadActivity } from '@/lib/api/audit'
import { parsePagination, paginatedResponse } from '@/lib/api/pagination'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  contactId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  assignedToId: z.string().uuid().optional(),
  source: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)

  // Build where clause
  const pipelineId = sp.get('pipelineId') ?? undefined
  const stageId = sp.get('stageId') ?? undefined
  const status = (sp.get('status') as any) ?? undefined
  const assignedToId = sp.get('assignedToId') ?? undefined
  const search = sp.get('search') ?? undefined

  // Agents only see their assigned leads unless manager/admin
  const canViewAll = hasPermission(user.role, 'view_all_leads')

  const where: any = {
    ...(pipelineId && { pipelineId }),
    ...(stageId && { stageId }),
    ...(status ? { status } : { status: { not: 'archived' } }),
    ...(assignedToId && { assignedToId }),
    ...(!canViewAll && { assignedToId: user.id }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search } } },
      ],
    }),
  }

  try {
    const [data, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          stage: { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, name: true } },
          leadTags: { include: { tag: true } },
        },
      }),
      prisma.lead.count({ where }),
    ])
    return ok(paginatedResponse(data, total, page, pageSize))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'create_lead')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const { tags, ...rest } = body

    const lead = await prisma.lead.create({
      data: {
        ...rest,
        createdById: user.id,
        stageMovedAt: new Date(),
        ...(tags?.length && {
          leadTags: {
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

    await createLeadActivity(lead.id, user.id, 'lead_created', `Lead created: ${lead.title}`)
    await createAuditLog({ userId: user.id, action: 'create', entityType: 'lead', entityId: lead.id, after: lead })
    return created(lead)
  } catch (err) {
    return serverError(err)
  }
}
