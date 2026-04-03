import express from 'express'
import sessionsRouter from './routes/sessions'
import { startSendWorker } from './worker/send-worker'

const PORT = parseInt(process.env.PORT ?? '3001')
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

const app = express()
app.use(express.json({ limit: '5mb' }))

// ── Auth middleware — all routes require the internal secret ─────────────────
app.use((req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${INTERNAL_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

// ── Health check (no auth) — place before auth middleware in production ──────
// (Caddy/Docker health check)
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/sessions', sessionsRouter)

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[whatsapp-engine] Running on port ${PORT}`)
})

// Start BullMQ send worker
startSendWorker()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[whatsapp-engine] SIGTERM received — shutting down gracefully')
  process.exit(0)
})
