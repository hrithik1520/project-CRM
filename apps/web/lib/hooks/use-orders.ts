import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface Payment {
  id: string
  amount: number
  method: string
  reference?: string
  note?: string
  paidAt: string
}

export interface Order {
  id: string
  title: string
  status: string
  currency: string
  subtotal: number
  total: number
  paidAmount: number
  leadId: string
  contactId: string
  createdAt: string
  contact: { id: string; name: string; phone: string }
  items: OrderItem[]
  payments: Payment[]
}

interface OrdersFilter {
  leadId?: string
  contactId?: string
  status?: string
  page?: number
  pageSize?: number
}

export function useOrders(filters: OrdersFilter = {}) {
  const params = new URLSearchParams()
  if (filters.leadId) params.set('leadId', filters.leadId)
  if (filters.contactId) params.set('contactId', filters.contactId)
  if (filters.status) params.set('status', filters.status)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  return useQuery<{ data: Order[]; total: number; page: number; pageSize: number; totalPages: number }>({
    queryKey: ['orders', filters],
    queryFn: () => api.get(`/api/orders?${params}`),
  })
}

export function useOrder(id: string) {
  return useQuery<Order & { lead: { id: string; title: string } }>({
    queryKey: ['orders', id],
    queryFn: () => api.get(`/api/orders/${id}`),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post<Order>('/api/orders', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => api.put<Order>(`/api/orders/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['orders', id] })
    },
  })
}

export function useAddPayment(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { amount: number; method: string; reference?: string; note?: string }) =>
      api.post<Payment>(`/api/orders/${orderId}/payments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['orders', orderId] })
    },
  })
}
