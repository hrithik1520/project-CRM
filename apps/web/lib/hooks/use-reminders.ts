import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Reminder {
  id: string
  title: string
  dueAt: string
  isDone: boolean
  doneAt?: string
  leadId: string
  lead: { id: string; title: string }
  assignedTo: { id: string; name: string }
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  dueAt?: string
  completedAt?: string
  leadId: string
  lead: { id: string; title: string }
  assignedTo: { id: string; name: string }
}

export function useReminders(filter: 'today' | 'overdue' | 'upcoming' | 'done' = 'upcoming') {
  return useQuery<Reminder[]>({
    queryKey: ['reminders', filter],
    queryFn: () => api.get(`/api/reminders?filter=${filter}`),
  })
}

export function useMarkReminderDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/api/reminders/${id}`, { isDone: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reminders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useTasks(status?: string) {
  const params = status ? `?status=${status}` : ''
  return useQuery<Task[]>({
    queryKey: ['tasks', status],
    queryFn: () => api.get(`/api/tasks${params}`),
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'todo' | 'in_progress' | 'done' }) =>
      api.put(`/api/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
