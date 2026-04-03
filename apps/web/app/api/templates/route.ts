import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { parsePagination, paginatedResponse } from '@/lib/api/pagination'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  body: z.string().min(1),
  category: z.string().default('general'),
  variables: z.array(z.string()).optional(),
  shortcut: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)
  const category = sp.get('category') ?? undefined

  try {
    const where: any = { ...(category && { category }) }
    const [data, total] = await prisma.$transaction([
      prisma.messageTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      }),
      prisma.messageTemplate.count({ where }),
    ])
    return ok(paginatedResponse(data, total, page, pageSize))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_templates')) return forbidden()

  try {
    const body = createSchema.parse(await req.json())
    const template = await prisma.messageTemplate.create({
      data: {
        ...body,
        variables: body.variables ?? [],
        createdById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return created(template)
  } catch (err) {
    return serverError(err)
  }
}
