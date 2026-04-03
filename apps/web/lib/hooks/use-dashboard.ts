import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface DashboardStats {
  leads: {
    total: number
    active: number
    won: number
    lost: number
    newThisMonth: number
  }
  revenue: {
    total: number
    thisMonth: number
  }
  dueToday: {
    reminders: number
    tasks: number
  }
  overdue: {
    reminders: number
  }
  whatsappSessions: {
    id: string
    status: string
    whatsappAccount: { id: string; name: string; phoneNumber: string }
  }[]
  recentActivity: {
    id: string
    action: string
    description: string
    createdAt: string
    lead: { id: string; title: string }
    user: { id: string; name: string }
  }[]
  pipelineSummary: {
    id: string
    name: string
    position: number
    pipeline: { id: string; name: string }
    _count: { leads: number }
  }[]
}

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard'),
    refetchInterval: 60_000, // refresh every minute
  })
}
