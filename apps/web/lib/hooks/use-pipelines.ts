import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export interface Stage {
  id: string
  name: string
  color?: string
  position: number
  isWon?: boolean
  isLost?: boolean
  pipelineId: string
}

export interface Pipeline {
  id: string
  name: string
  description?: string
  isDefault: boolean
  position: number
  stages: Stage[]
  _count?: { leads: number }
}

export function usePipelines() {
  return useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/api/pipelines'),
  })
}

export function usePipeline(id: string) {
  return useQuery<Pipeline>({
    queryKey: ['pipelines', id],
    queryFn: () => api.get(`/api/pipelines/${id}`),
    enabled: !!id,
  })
}

export function useCreatePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => api.post<Pipeline>('/api/pipelines', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useUpdatePipeline(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pipeline>) => api.put<Pipeline>(`/api/pipelines/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useDeletePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/pipelines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useCreateStage(pipelineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color?: string; isWon?: boolean; isLost?: boolean }) =>
      api.post<Stage>(`/api/pipelines/${pipelineId}/stages`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}

export function useReorderStages(pipelineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: { id: string; position: number }[]) =>
      api.put<Stage[]>(`/api/pipelines/${pipelineId}/stages`, { stages }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines'] }),
  })
}
