import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  isDone: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  dueAt: z.string().datetime().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const reminder = await prisma.reminder.findUnique({ where: { id } })
    if (!reminder) return notFound('Reminder')
    if (reminder.assignedToId !== user.id && reminder.createdById !== user.id) return forbidden()

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...body,
        ...(body.dueAt && { dueAt: new Date(body.dueAt) }),
        ...(body.isDone && { doneAt: new Date() }),
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
    const reminder = await prisma.reminder.findUnique({ where: { id } })
    if (!reminder) return notFound('Reminder')
    if (reminder.assignedToId !== user.id && reminder.createdById !== user.id) return forbidden()

    await prisma.reminder.delete({ where: { id } })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
