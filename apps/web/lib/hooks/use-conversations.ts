import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Message {
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  body: string | null
  type: string
  status: string
  waMessageId?: string | null
  mediaUrl?: string | null
  templateId?: string | null
  sentAt?: string | null
  deliveredAt?: string | null
  readAt?: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  contactId: string
  whatsappAccountId: string
  leadId?: string | null
  lastMessageAt?: string | null
  lastMessageBody?: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
  contact: { id: string; name: string; phone: string; email?: string | null }
  whatsappAccount: { id: string; name: string }
  messages?: Message[]
}

export interface PaginatedConversations {
  data: Conversation[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface ConversationFilters {
  whatsappAccountId?: string
  leadId?: string
  page?: number
  pageSize?: number
}

function buildUrl(filters: ConversationFilters = {}) {
  const p = new URLSearchParams()
  if (filters.whatsappAccountId) p.set('whatsappAccountId', filters.whatsappAccountId)
  if (filters.leadId) p.set('leadId', filters.leadId)
  if (filters.page) p.set('page', String(filters.page))
  if (filters.pageSize) p.set('pageSize', String(filters.pageSize))
  return `/api/conversations?${p}`
}

export function useConversations(filters: ConversationFilters = {}) {
  return useQuery<PaginatedConversations>({
    queryKey: ['conversations', filters],
    queryFn: () => api.get(buildUrl(filters)),
    refetchInterval: 10000, // Poll every 10s for new messages
  })
}

export function useConversation(id: string) {
  return useQuery<Conversation>({
    queryKey: ['conversations', id],
    queryFn: () => api.get(`/api/conversations/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  })
}

export function useMarkConversationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Conversation>(`/api/conversations/${id}`, {}),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations', id] })
    },
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { body: string; type?: string; templateId?: string; mediaUrl?: string }) =>
      api.post<Message>(`/api/conversations/${conversationId}/messages`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations', conversationId] })
    },
  })
}
