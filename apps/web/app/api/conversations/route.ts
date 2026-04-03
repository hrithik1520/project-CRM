import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, serverError } from '@/lib/api/response'
import { parsePagination, paginatedResponse } from '@/lib/api/pagination'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  const sp = req.nextUrl.searchParams
  const { skip, take, page, pageSize } = parsePagination(sp)
  const whatsappAccountId = sp.get('whatsappAccountId') ?? undefined
  const leadId = sp.get('leadId') ?? undefined

  const canViewAll = hasPermission(user.role, 'view_all_leads')

  try {
    // For agents, only show conversations linked to their assigned leads
    let leadFilter: string[] | undefined
    if (!canViewAll) {
      const assignedLeads = await prisma.lead.findMany({
        where: { assignedToId: user.id },
        select: { id: true },
      })
      leadFilter = assignedLeads.map((l) => l.id)
    }

    const where: any = {
      ...(whatsappAccountId && { whatsappAccountId }),
      ...(leadId && { leadId }),
      ...(leadFilter && { leadId: { in: leadFilter } }),
    }

    const [data, total] = await prisma.$transaction([
      prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          whatsappAccount: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, direction: true, status: true, createdAt: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ])
    return ok(paginatedResponse(data, total, page, pageSize))
  } catch (err) {
    return serverError(err)
  }
}
