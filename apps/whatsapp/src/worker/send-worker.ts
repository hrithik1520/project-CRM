import { Worker } from 'bullmq'
import { sessionManager } from '../sessions/session-manager'
import type { SendMessageJobPayload } from '@crm/types'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

export function startSendWorker() {
  const connection = {
    host: new URL(REDIS_URL).hostname,
    port: parseInt(new URL(REDIS_URL).port || '6379'),
    // Don't crash on connection failure — just log and retry
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
  }

  const worker = new Worker<SendMessageJobPayload>(
    'whatsapp-send',
    async (job) => {
      const { messageId, sessionId, to, body } = job.data

      console.log(`[send-worker] Processing job ${job.id} — session:${sessionId} to:${to}`)

      const waMessageId = await sessionManager.sendMessage(sessionId, to, body)

      // Notify web app of success
      await notifyWebApp(messageId, 'sent', waMessageId)

      console.log(`[send-worker] Sent job ${job.id} — waId:${waMessageId}`)
    },
    {
      connection,
      concurrency: 4,
      // Retry config: 3 attempts with exponential backoff
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
    }
  )

  worker.on('failed', async (job, err) => {
    if (!job) return
    console.error(`[send-worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message)

    // Mark as failed in DB after all retries exhausted
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await notifyWebApp(job.data.messageId, 'failed', undefined, err.message)
    }
  })

  worker.on('error', (err) => {
    console.warn('[send-worker] Worker error (Redis unavailable?):', err.message)
  })

  console.log('[send-worker] Started — listening for jobs')
  return worker
}

async function notifyWebApp(messageId: string, status: 'sent' | 'failed', waMessageId?: string, error?: string) {
  try {
    await fetch(`${WEB_APP_URL}/api/internal/message-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ messageId, status, waMessageId, error }),
    })
  } catch (err) {
    console.error('[send-worker] Failed to notify web app:', err)
  }
}
