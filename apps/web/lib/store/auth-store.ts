// Auth is handled entirely by Clerk.
// Use these Clerk hooks directly in components:
//
//   import { useUser, useAuth } from '@clerk/nextjs'
//   const { user, isLoaded, isSignedIn } = useUser()
//   const { userId, getToken } = useAuth()
//
// For server components and API routes:
//   import { auth, currentUser } from '@clerk/nextjs/server'
//   const { userId } = await auth()
//   const user = await currentUser()
//
// CRM role stored in Clerk publicMetadata: { role: 'admin' | 'manager' | 'agent' }
// Set via Clerk Dashboard or Clerk Backend API after first signup.

export {}
