import { NextRequest } from 'next/server'
import { prisma } from '@crm/db'
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/response'
import { createLeadActivity } from '@/lib/api/audit'
import { z } from 'zod'

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

const bodySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  pipelineId: z.string().uuid().optional(),
  message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Auth: X-Webhook-Secret header — accepts env secret OR any active DB webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (!secret) return unauthorized()

  const isEnvSecret = secret === INTERNAL_SECRET
  if (!isEnvSecret) {
    const dbWebhook = await prisma.webhook.findFirst({ where: { secret, isActive: true } })
    if (!dbWebhook) return unauthorized()
    // Increment hit counter (fire-and-forget)
    prisma.webhook.update({ where: { id: dbWebhook.id }, data: { totalHits: { increment: 1 }, lastHitAt: new Date() } }).catch(() => null)
  }

  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { name, phone, email, company, source, utm_source, utm_medium, utm_campaign, pipelineId, message } = parsed.data

    // Dedup contact by phone
    let contact = await prisma.contact.findUnique({ where: { phone } })

    // Get system admin user as createdBy fallback
    const systemUser = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } })
    if (!systemUser) return serverError(new Error('No admin user found for lead assignment'))

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name,
          phone,
          email: email ?? null,
          company: company ?? null,
          source: source ?? null,
          utmSource: utm_source ?? null,
          utmMedium: utm_medium ?? null,
          utmCampaign: utm_campaign ?? null,
          createdById: systemUser.id,
        },
      })
    }

    // Find default pipeline if not specified
    let resolvedPipelineId = pipelineId
    if (!resolvedPipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({ where: { isDefault: true } })
        ?? await prisma.pipeline.findFirst({ orderBy: { position: 'asc' } })
      resolvedPipelineId = defaultPipeline?.id
    }
    if (!resolvedPipelineId) return serverError(new Error('No pipeline found'))

    // First stage of the pipeline
    const firstStage = await prisma.leadStage.findFirst({
      where: { pipelineId: resolvedPipelineId },
      orderBy: { position: 'asc' },
    })
    if (!firstStage) return serverError(new Error('No stage found in pipeline'))

    const lead = await prisma.lead.create({
      data: {
        title: `${name}${company ? ` — ${company}` : ''}`,
        contactId: contact.id,
        pipelineId: resolvedPipelineId,
        stageId: firstStage.id,
        createdById: systemUser.id,
        source: source ?? utm_source ?? null,
        stageMovedAt: new Date(),
      },
    })

    await createLeadActivity(lead.id, null, 'lead_created', `Lead captured via webhook from ${source ?? 'external form'}`, {
      utm_source,
      utm_medium,
      utm_campaign,
      message,
    })

    return ok({ success: true, leadId: lead.id, contactId: contact.id })
  } catch (err) {
    return serverError(err)
  }
}
