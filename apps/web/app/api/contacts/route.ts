import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { ok, created, conflict, unauthorized, serverError } from '@/lib/api/response'
import { createAuditLog } from '@/lib/api/audit'
import { parsePagination, paginatedResponse } from '@/lib/api/pagination'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  email: z.string().email().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)
  const search = sp.get('search') ?? undefined

  const where: any = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  try {
    const [data, total] = await prisma.$transaction([
      prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contactTags: { include: { tag: true } },
          _count: { select: { leads: true, conversations: true } },
        },
      }),
      prisma.contact.count({ where }),
    ])
    return ok(paginatedResponse(data, total, page, pageSize))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  try {
    const body = createSchema.parse(await req.json())
    const { tags, ...rest } = body

    // Dedup by phone
    const existing = await prisma.contact.findUnique({ where: { phone: rest.phone } })
    if (existing) return conflict('A contact with this phone number already exists')

    const contact = await prisma.contact.create({
      data: {
        ...rest,
        createdById: user.id,
        ...(tags?.length && {
          contactTags: {
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

    await createAuditLog({ userId: user.id, action: 'create', entityType: 'contact', entityId: contact.id, after: contact })
    return created(contact)
  } catch (err) {
    return serverError(err)
  }
}
