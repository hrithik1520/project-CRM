import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CRMRole = 'admin' | 'manager' | 'agent'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: CRMRole
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'crm-auth' }
  )
)
