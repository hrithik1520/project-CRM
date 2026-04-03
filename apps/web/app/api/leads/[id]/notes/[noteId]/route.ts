import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  content: z.string().min(1).max(5000),
})

type Params = { params: Promise<{ id: string; noteId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id, noteId } = await params

  try {
    const note = await prisma.note.findUnique({ where: { id: noteId, leadId: id } })
    if (!note) return notFound('Note')

    // Only note author or admin/manager can edit
    if (note.createdById !== user.id && !hasPermission(user.role, 'view_all_leads')) return forbidden()

    const { content } = updateSchema.parse(await req.json())
    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { content },
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id, noteId } = await params

  try {
    const note = await prisma.note.findUnique({ where: { id: noteId, leadId: id } })
    if (!note) return notFound('Note')

    if (note.createdById !== user.id && !hasPermission(user.role, 'view_all_leads')) return forbidden()

    await prisma.note.delete({ where: { id: noteId } })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
