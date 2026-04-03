import { auth } from '@/lib/auth/config'
import type { CRMRole } from '@/lib/permissions'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: CRMRole
}

/**
 * Call at the top of any API route handler.
 * Returns the session user or null if unauthenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const user = session.user as { id?: string; email?: string; name?: string; role?: string }
  if (!user.id) return null
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
    role: (user.role as CRMRole) ?? 'agent',
  }
}
