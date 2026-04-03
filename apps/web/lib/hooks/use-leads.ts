import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Lead {
  id: string
  title: string
  status: string
  score: number
  source?: string
  lostReason?: string
  stageId: string
  pipelineId: string
  assignedToId?: string
  createdById: string
  stageMovedAt?: string
  wonAt?: string
  lostAt?: string
  createdAt: string
  updatedAt: string
  contact: { id: string; name: string; phone: string }
  stage: { id: string; name: string; color?: string }
  assignedTo?: { id: string; name: string }
  leadTags: { tag: { id: string; name: string } }[]
}

export interface PaginatedLeads {
  data: Lead[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface LeadsFilter {
  pipelineId?: string
  stageId?: string
  status?: string
  assignedToId?: string
  search?: string
  page?: number
  pageSize?: number
}

function buildLeadsUrl(filters: LeadsFilter = {}) {
  const params = new URLSearchParams()
  if (filters.pipelineId) params.set('pipelineId', filters.pipelineId)
  if (filters.stageId) params.set('stageId', filters.stageId)
  if (filters.status) params.set('status', filters.status)
  if (filters.assignedToId) params.set('assignedToId', filters.assignedToId)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
  return `/api/leads?${params}`
}

export function useLeads(filters: LeadsFilter = {}) {
  return useQuery<PaginatedLeads>({
    queryKey: ['leads', filters],
    queryFn: () => api.get(buildLeadsUrl(filters)),
  })
}

export function useLead(id: string) {
  return useQuery<Lead & { notes: any[]; reminders: any[]; tasks: any[]; orders: any[]; activity: any[] }>({
    queryKey: ['leads', id],
    queryFn: () => api.get(`/api/leads/${id}`),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Lead> & { tags?: string[] }) => api.post<Lead>('/api/leads', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Lead> & { tags?: string[] }) => api.put<Lead>(`/api/leads/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['leads', id] })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// Lead notes
export function useLeadNotes(leadId: string) {
  return useQuery<any[]>({
    queryKey: ['leads', leadId, 'notes'],
    queryFn: () => api.get(`/api/leads/${leadId}/notes`),
    enabled: !!leadId,
  })
}

export function useAddLeadNote(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => api.post(`/api/leads/${leadId}/notes`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] }),
  })
}

export function useDeleteLeadNote(leadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => api.delete(`/api/leads/${leadId}/notes/${noteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads', leadId, 'notes'] }),
  })
}

// Lead activity
export function useLeadActivity(leadId: string) {
  return useQuery<any[]>({
    queryKey: ['leads', leadId, 'activity'],
    queryFn: () => api.get(`/api/leads/${leadId}/activity`),
    enabled: !!leadId,
  })
}
