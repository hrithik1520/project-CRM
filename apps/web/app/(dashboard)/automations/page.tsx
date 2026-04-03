'use client'

import { useState } from 'react'
import { Plus, Zap, X, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface Automation {
  id: string
  name: string
  description?: string | null
  triggerType: string
  triggerConfig: Record<string, any>
  conditions: any[]
  actionType: string
  actionConfig: Record<string, any>
  isActive: boolean
  pipelineId?: string | null
  createdAt: string
  updatedAt: string
  _count?: { runs: number }
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Lead Created',
  lead_assigned: 'Lead Assigned',
  stage_changed: 'Stage Changed',
  no_reply: 'No Reply After',
  no_followup: 'No Follow-up After',
  payment_pending: 'Payment Pending',
  lead_stale: 'Lead Inactive',
}

const ACTION_LABELS: Record<string, string> = {
  send_whatsapp: 'Send WhatsApp Message',
  create_task: 'Create Task',
  create_reminder: 'Create Reminder',
  move_stage: 'Move to Stage',
  assign_user: 'Assign to User',
  send_notification: 'Send Internal Notification',
}

function AutomationSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-56 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-gray-100 rounded-full" />
            <div className="h-5 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formTrigger, setFormTrigger] = useState(Object.keys(TRIGGER_LABELS)[0]!)
  const [formAction, setFormAction] = useState(Object.keys(ACTION_LABELS)[0]!)

  const qc = useQueryClient()

  const { data: automations, isLoading } = useQuery<Automation[]>({
    queryKey: ['automations'],
    queryFn: () => api.get('/api/automations'),
  })

  const createAutomation = useMutation({
    mutationFn: (data: object) => api.post<Automation>('/api/automations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  const updateAutomation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Automation> }) =>
      api.put<Automation>(`/api/automations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  const deleteAutomation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/automations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  async function handleCreate() {
    if (!formName.trim()) return
    await createAutomation.mutateAsync({
      name: formName.trim(),
      triggerType: formTrigger,
      actionType: formAction,
      isActive: true,
    })
    setShowForm(false)
    setFormName('')
  }

  function toggleActive(auto: Automation) {
    updateAutomation.mutate({ id: auto.id, data: { isActive: !auto.isActive } })
  }

  const activeCount = automations?.filter((a) => a.isActive).length ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Loading...' : `${activeCount} active rule${activeCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Info banner */}
      <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <strong>How automations work:</strong> Rules run every 5 minutes. Each rule checks for matching leads and executes the configured action. A rule will not run more than once per lead per hour.
      </div>

      {/* Automation list */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <AutomationSkeleton key={i} />)
          : automations?.map((auto) => (
            <div
              key={auto.id}
              className={cn(
                'bg-white rounded-xl border p-4 transition-colors',
                auto.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    auto.isActive ? 'bg-purple-100' : 'bg-gray-100'
                  )}>
                    <Zap className={cn('w-4 h-4', auto.isActive ? 'text-purple-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{auto.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
                        <span className="font-medium">When:</span> {TRIGGER_LABELS[auto.triggerType] ?? auto.triggerType}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
                        <span className="font-medium">Then:</span> {ACTION_LABELS[auto.actionType] ?? auto.actionType}
                      </span>
                    </div>
                    {auto._count && (
                      <p className="text-xs text-gray-400 mt-1.5">{auto._count.runs} runs</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(auto)}
                    disabled={updateAutomation.isPending}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                    title={auto.isActive ? 'Disable' : 'Enable'}
                  >
                    {auto.isActive
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                  </button>
                  <button
                    onClick={() => deleteAutomation.mutate(auto.id)}
                    className="p-1 text-red-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

        {!isLoading && (!automations || automations.length === 0) && (
          <div className="text-center py-16">
            <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No automation rules yet</p>
            <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 text-sm text-white bg-primary rounded-lg">
              Create your first rule
            </button>
          </div>
        )}
      </div>

      {/* Create rule modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">New Automation Rule</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rule Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Send intro on assignment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">When (Trigger)</label>
                <select
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Then (Action)</label>
                <select
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(ACTION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formName.trim() || createAutomation.isPending}
                className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
