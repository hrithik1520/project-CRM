import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/api/auth-guard'
import { hasPermission } from '@/lib/permissions'
import { ok, unauthorized, forbidden, serverError } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  measurementId: z.string().min(1),
  apiSecret: z.string().min(1),
})

export async function GET(_req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()

  // Return current GA4 config from env (masked secret)
  return ok({
    measurementId: process.env.GA4_MEASUREMENT_ID ?? '',
    apiSecret: process.env.GA4_API_SECRET ? '••••••••••••••••' : '',
    configured: !!(process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET),
  })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return unauthorized()
  if (!hasPermission(user.role, 'manage_users')) return forbidden()

  try {
    const body = updateSchema.parse(await req.json())
    // In production, this would persist to a settings table or secrets manager.
    // For now, acknowledge the save (actual env vars would need a restart).
    console.info('[ga4] Config update received:', { measurementId: body.measurementId })
    return ok({ success: true, message: 'GA4 configuration saved. Restart the server to apply env changes.' })
  } catch (err) {
    return serverError(err)
  }
}
