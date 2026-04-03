import { prisma } from '@crm/db'

/**
 * Server-side GA4 Measurement Protocol helper.
 * Queues a GA4 event to the ga4_event_queue table.
 * A separate worker drains this queue and POSTs to GA4 API.
 */
export async function queueGA4Event(
  eventName: string,
  params: Record<string, any>,
  clientId?: string
): Promise<void> {
  try {
    await prisma.gA4EventQueue.create({
      data: {
        eventName,
        parameters: params,
        clientId: clientId ?? null,
        status: 'pending',
      },
    })
  } catch (err) {
    // Non-fatal — log but don't fail the main request
    console.error('[ga4] Failed to queue GA4 event:', err)
  }
}
