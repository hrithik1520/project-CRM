import type { InternalEvent } from '@crm/types'

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

export async function postInternalEvent(event: InternalEvent): Promise<void> {
  try {
    const res = await fetch(`${WEB_APP_URL}/api/internal/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify(event),
    })
    if (!res.ok) {
      console.error(`[event-poster] Failed to post event: ${res.status} ${res.statusText}`)
    }
  } catch (err) {
    // Non-fatal — web app may be temporarily down
    console.error('[event-poster] Error posting event:', err)
  }
}
