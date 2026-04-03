import { Router, Request, Response } from 'express'
import { sessionManager } from '../sessions/session-manager'

const router = Router()

// GET /sessions — list all session statuses
router.get('/', (_req: Request, res: Response) => {
  res.json(sessionManager.getAllStatuses())
})

// POST /sessions/:id/start — start or restore a session
router.post('/:id/start', async (req: Request, res: Response) => {
  const { id } = req.params
  const { accountId } = req.body as { accountId: string }

  if (!accountId) {
    res.status(400).json({ error: 'accountId is required' })
    return
  }

  try {
    // Non-blocking: start in background
    sessionManager.startSession(id, accountId).catch((err) => {
      console.error(`[route] Failed to start session ${id}:`, err)
    })
    res.json({ sessionId: id, status: 'initializing' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session' })
  }
})

// GET /sessions/:id/status — get session status + QR if available
router.get('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params
  const status = sessionManager.getStatus(id)
  const qrData = sessionManager.getQR(id)

  if (!status) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  res.json({ sessionId: id, status, qr: qrData ?? null })
})

// POST /sessions/:id/stop — stop session gracefully
router.post('/:id/stop', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await sessionManager.stopSession(id)
    res.json({ sessionId: id, status: 'stopped' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop session' })
  }
})

// POST /sessions/:id/logout — logout and delete auth files
router.post('/:id/logout', async (req: Request, res: Response) => {
  const { id } = req.params
  const { accountId } = req.body as { accountId: string }
  try {
    await sessionManager.logoutSession(id, accountId ?? '')
    res.json({ sessionId: id, status: 'logged_out' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to logout session' })
  }
})

// POST /sessions/:id/send — send message (called by web app via queue worker; also available for direct send)
router.post('/:id/send', async (req: Request, res: Response) => {
  const { id } = req.params
  const { to, body } = req.body as { to: string; body: string }

  if (!to || !body) {
    res.status(400).json({ error: 'to and body are required' })
    return
  }

  try {
    const waMessageId = await sessionManager.sendMessage(id, to, body)
    res.json({ waMessageId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default router
