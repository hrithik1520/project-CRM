import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  company?: string
  address?: string
  notes?: string
  createdAt: string
  contactTags: { tag: { id: string; name: string } }[]
  _count?: { leads: number; conversations: number }
}

interface ContactsFilter {
  search?: string
  page?: number
  pageSize?: number
}

function buildUrl(filters: ContactsFilter = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
  return `/api/contacts?${params}`
}

export function useContacts(filters: ContactsFilter = {}) {
  return useQuery<{ data: Contact[]; total: number; page: number; pageSize: number; totalPages: number }>({
    queryKey: ['contacts', filters],
    queryFn: () => api.get(buildUrl(filters)),
  })
}

export function useContact(id: string) {
  return useQuery<Contact & { leads: any[]; conversations: any[] }>({
    queryKey: ['contacts', id],
    queryFn: () => api.get(`/api/contacts/${id}`),
    enabled: !!id,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Contact> & { tags?: string[] }) => api.post<Contact>('/api/contacts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Contact> & { tags?: string[] }) => api.put<Contact>(`/api/contacts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts', id] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
