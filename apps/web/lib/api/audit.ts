import { prisma } from '@crm/db'

interface AuditOptions {
  userId?: string
  action: string
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
  ip?: string
}

export async function createAuditLog(opts: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        before: opts.before ? (opts.before as any) : undefined,
        after: opts.after ? (opts.after as any) : undefined,
        ip: opts.ip ?? null,
      },
    })
  } catch (err) {
    // Non-fatal — log but don't fail the request
    console.error('[audit] Failed to write audit log:', err)
  }
}

export async function createLeadActivity(
  leadId: string,
  userId: string | null,
  type: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        type,
        description,
        metadata: metadata ?? {},
      },
    })
  } catch (err) {
    console.error('[audit] Failed to write lead activity:', err)
  }
}
