import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
  shortcut: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: params.id },
      include: { createdBy: { select: { id: true, name: true } } },
    })
    if (!template) return notFound('Template')
    return ok(template)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_templates')) return forbidden()

  try {
    const body = updateSchema.parse(await req.json())
    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: body,
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return ok(template)
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_templates')) return forbidden()

  try {
    const exists = await prisma.messageTemplate.findUnique({ where: { id: params.id } })
    if (!exists) return notFound('Template')
    await prisma.messageTemplate.delete({ where: { id: params.id } })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
