'use client'

import { useState } from 'react'
import { Plus, Zap, X, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DUMMY_AUTOMATIONS = [
  {
    id: 'auto1',
    name: 'Send intro message on lead assignment',
    trigger: 'lead_assigned',
    action: 'send_whatsapp_message',
    template: 'First Contact',
    isActive: true,
    runs: 24,
    lastRun: new Date(Date.now() - 3600000),
  },
  {
    id: 'auto2',
    name: 'Create task if no reply in 24 hours',
    trigger: 'no_reply_after',
    triggerConfig: '24 hours',
    action: 'create_task',
    actionConfig: 'Follow up — no reply',
    isActive: true,
    runs: 8,
    lastRun: new Date(Date.now() - 86400000),
  },
  {
    id: 'auto3',
    name: 'Move lead to Stale after 7 days inactivity',
    trigger: 'lead_stale',
    triggerConfig: '7 days',
    action: 'move_to_stage',
    actionConfig: 'Stale',
    isActive: false,
    runs: 2,
    lastRun: new Date(Date.now() - 5 * 86400000),
  },
  {
    id: 'auto4',
    name: 'Send payment reminder on pending payment',
    trigger: 'payment_pending',
    action: 'send_whatsapp_message',
    template: 'Payment Reminder',
    isActive: true,
    runs: 5,
    lastRun: new Date(Date.now() - 2 * 86400000),
  },
]

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: 'Lead Created',
  lead_assigned: 'Lead Assigned',
  stage_changed: 'Stage Changed',
  no_reply_after: 'No Reply After',
  no_followup_after: 'No Follow-up After',
  payment_pending: 'Payment Pending',
  lead_stale: 'Lead Inactive',
}

const ACTION_LABELS: Record<string, string> = {
  send_whatsapp_message: 'Send WhatsApp Message',
  create_task: 'Create Task',
  create_reminder: 'Create Reminder',
  move_to_stage: 'Move to Stage',
  assign_to_user: 'Assign to User',
  send_notification: 'Send Internal Notification',
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(DUMMY_AUTOMATIONS)
  const [showForm, setShowForm] = useState(false)

  function toggleActive(id: string) {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {automations.filter((a) => a.isActive).length} active rule{automations.filter((a) => a.isActive).length !== 1 ? 's' : ''}
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
        {automations.map((auto) => (
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
                    {/* Trigger */}
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
                      <span className="font-medium">When:</span> {TRIGGER_LABELS[auto.trigger] ?? auto.trigger}
                      {'triggerConfig' in auto && auto.triggerConfig && <span>({auto.triggerConfig})</span>}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    {/* Action */}
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
                      <span className="font-medium">Then:</span> {ACTION_LABELS[auto.action] ?? auto.action}
                      {'template' in auto && auto.template && <span>({auto.template})</span>}
                      {'actionConfig' in auto && auto.actionConfig && !('template' in auto) && <span>({auto.actionConfig})</span>}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {auto.runs} runs · Last run {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(auto.lastRun)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(auto.id)}
                  className="text-gray-400 hover:text-gray-700"
                  title={auto.isActive ? 'Disable' : 'Enable'}
                >
                  {auto.isActive
                    ? <ToggleRight className="w-6 h-6 text-green-500" />
                    : <ToggleLeft className="w-6 h-6 text-gray-300" />
                  }
                </button>
              </div>
            </div>
          </div>
        ))}

        {automations.length === 0 && (
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
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Send intro on assignment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">When (Trigger)</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Then (Action)</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
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
              <button className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
