import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  title: z.string().min(1).max(200).optional(),
  dueAt: z.string().datetime().nullable().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return notFound('Task')
    if (task.assignedToId !== user.id && task.createdById !== user.id) return forbidden()

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        ...(body.dueAt !== undefined && { dueAt: body.dueAt ? new Date(body.dueAt) : null }),
        ...(body.status === 'done' && { completedAt: new Date() }),
      },
      include: { lead: { select: { id: true, title: true } }, assignedTo: { select: { id: true, name: true } } },
    })
    return ok(updated)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return notFound('Task')
    if (task.assignedToId !== user.id && task.createdById !== user.id) return forbidden()

    await prisma.task.delete({ where: { id } })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
