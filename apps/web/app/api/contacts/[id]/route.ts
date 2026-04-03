import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/api/response'
import { createAuditLog } from '@/lib/api/audit'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(30).optional(),
  email: z.string().email().nullable().optional(),
  company: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactTags: { include: { tag: true } },
        leads: {
          where: { status: { not: 'archived' } },
          orderBy: { createdAt: 'desc' },
          include: {
            stage: { select: { id: true, name: true, color: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: { whatsappAccount: { select: { id: true, name: true, phoneNumber: true } } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    })
    if (!contact) return notFound('Contact')
    return ok(contact)
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  const { id } = await params

  try {
    const existing = await prisma.contact.findUnique({ where: { id } })
    if (!existing) return notFound('Contact')

    const body = updateSchema.parse(await req.json())
    const { tags, ...rest } = body

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined && {
          contactTags: {
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
        contactTags: { include: { tag: true } },
        _count: { select: { leads: true, conversations: true } },
      },
    })

    await createAuditLog({ userId: user.id, action: 'update', entityType: 'contact', entityId: id, before: existing, after: contact })
    return ok(contact)
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
    const contact = await prisma.contact.findUnique({ where: { id } })
    if (!contact) return notFound('Contact')

    // Soft delete: mark as archived via a deletedAt timestamp pattern
    // Since Contact model doesn't have status, we just delete (no active leads check needed — leads are soft-deleted separately)
    await prisma.contact.delete({ where: { id } })
    await createAuditLog({ userId: user.id, action: 'delete', entityType: 'contact', entityId: id, before: contact })
    return noContent()
  } catch (err) {
    return serverError(err)
  }
}
