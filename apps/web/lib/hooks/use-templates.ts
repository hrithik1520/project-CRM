import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface MessageTemplate {
  id: string
  name: string
  body: string
  category: string
  variables: string[]
  shortcut?: string | null
  isGlobal: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; name: string }
}

export interface PaginatedTemplates {
  data: MessageTemplate[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface TemplateFilters {
  category?: string
  page?: number
  pageSize?: number
}

function buildUrl(filters: TemplateFilters = {}) {
  const p = new URLSearchParams()
  if (filters.category && filters.category !== 'All') p.set('category', filters.category)
  if (filters.page) p.set('page', String(filters.page))
  if (filters.pageSize) p.set('pageSize', String(filters.pageSize))
  return `/api/templates?${p}`
}

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery<PaginatedTemplates>({
    queryKey: ['templates', filters],
    queryFn: () => api.get(buildUrl(filters)),
  })
}

export function useTemplate(id: string) {
  return useQuery<MessageTemplate>({
    queryKey: ['templates', id],
    queryFn: () => api.get(`/api/templates/${id}`),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<MessageTemplate>) => api.post<MessageTemplate>('/api/templates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<MessageTemplate>) => api.put<MessageTemplate>(`/api/templates/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      qc.invalidateQueries({ queryKey: ['templates', id] })
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}
