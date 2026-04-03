'use client'

import { useUser } from '@clerk/nextjs'

export type CRMRole = 'admin' | 'manager' | 'agent'

export function useCRMUser() {
  const { user, isLoaded, isSignedIn } = useUser()

  const role = (user?.publicMetadata?.role as CRMRole) ?? 'agent'

  const isAdmin = role === 'admin'
  const isManager = role === 'manager' || role === 'admin'

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
    isAdmin,
    isManager,
    name: user?.fullName ?? user?.firstName ?? 'User',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    avatarUrl: user?.imageUrl,
    userId: user?.id,
  }
}
