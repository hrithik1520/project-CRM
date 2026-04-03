import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createLeadActivity } from '@/lib/api/audit'
import { z } from 'zod'

const createSchema = z.object({
  content: z.string().min(1).max(5000),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } })
    if (!lead) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    const notes = await prisma.note.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return ok(notes)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, assignedToId: true } })
    if (!lead) return notFound('Lead')

    const canViewAll = hasPermission(user.role, 'view_all_leads')
    if (!canViewAll && lead.assignedToId !== user.id) return forbidden()

    const { content } = createSchema.parse(await req.json())
    const note = await prisma.note.create({
      data: { content, leadId: id, createdById: user.id },
      include: { createdBy: { select: { id: true, name: true } } },
    })

    await createLeadActivity(id, user.id, 'note_added', 'Note added')
    return created(note)
  } catch (err) {
    return serverError(err)
  }
}
