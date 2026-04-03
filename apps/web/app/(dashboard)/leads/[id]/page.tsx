'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Phone, Mail, Building2, Tag, ChevronDown, Plus, Clock,
  Bell, CheckSquare, ShoppingBag, FileText, Activity,
  ArrowLeft, Edit, Wifi,
} from 'lucide-react'
import Link from 'next/link'
import { useLead, useUpdateLead, useLeadNotes, useAddLeadNote, useLeadActivity } from '@/lib/hooks/use-leads'
import { useOrders } from '@/lib/hooks/use-orders'
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils'

const TABS = ['Activity', 'Notes', 'Messages', 'Reminders', 'Tasks', 'Orders'] as const
type Tab = (typeof TABS)[number]

const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
  vip: 'bg-purple-100 text-purple-700',
  'bulk-order': 'bg-green-100 text-green-700',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('Activity')
  const [newNote, setNewNote] = useState('')

  const { data: lead, isLoading } = useLead(leadId)
  const { data: activity = [] } = useLeadActivity(leadId)
  const { data: notes = [] } = useLeadNotes(leadId)
  const { data: ordersData } = useOrders({ leadId })
  const orders = ordersData?.data ?? []

  const addNote = useAddLeadNote(leadId)
  const updateLead = useUpdateLead(leadId)

  async function handleAddNote() {
    if (!newNote.trim()) return
    await addNote.mutateAsync(newNote.trim())
    setNewNote('')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm text-gray-500">Lead not found</p>
        <Link href="/leads" className="text-sm text-blue-600 hover:underline">Back to leads</Link>
      </div>
    )
  }

  const tags = lead.leadTags.map((lt) => lt.tag.name)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <Link href="/leads" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{lead.title}</h1>
          <p className="text-sm text-gray-500">{lead.contact.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.stage.color ?? '#94a3b8' }} />
            {lead.stage.name}
          </span>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4 space-y-4">
          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {lead.contact.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{lead.contact.name}</p>
                <p className="text-xs text-gray-500">{lead.contact.phone}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.contact.phone}</div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>
                  {t}
                </span>
              ))}
              <button className="px-2 py-0.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:border-gray-400">
                + tag
              </button>
            </div>
          </div>

          {/* Pipeline Stage */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pipeline Stage</p>
            <button className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.stage.color ?? '#94a3b8' }} />
                {lead.stage.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Assigned */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Assigned To</p>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold">
                {(lead.assignedTo?.name ?? '?').charAt(0)}
              </div>
              {lead.assignedTo?.name ?? 'Unassigned'}
            </div>
          </div>

          {/* Source */}
          {lead.source && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lead Source</p>
              <p className="text-sm text-gray-600 capitalize">{lead.source}</p>
            </div>
          )}

          {/* Score */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', lead.score >= 80 ? 'bg-green-500' : lead.score >= 50 ? 'bg-amber-500' : 'bg-gray-300')}
                  style={{ width: `${lead.score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700">{lead.score}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Actions</p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                <Wifi className="w-4 h-4" />
                Send WhatsApp
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Bell className="w-4 h-4 text-amber-500" />
                Add Reminder
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                Create Order
              </button>
              <button
                onClick={() => updateLead.mutate({ status: 'won' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                Mark Won
              </button>
              <button
                onClick={() => updateLead.mutate({ status: 'lost' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                Mark Lost
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — tabs */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="flex border-b border-gray-200 bg-white px-4 shrink-0 sticky top-0 z-10">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Activity tab */}
            {activeTab === 'Activity' && (
              <div className="space-y-3">
                {activity.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>}
                {activity.map((entry: any, i: number) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                        <Activity className="w-3 h-3 text-gray-400" />
                      </div>
                      {i < activity.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm text-gray-900">{entry.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {entry.user?.name} · {formatRelativeTime(new Date(entry.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes tab */}
            {activeTab === 'Notes' && (
              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-gray-200 p-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-sm resize-none focus:outline-none min-h-[80px] text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addNote.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
                {notes.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No notes yet</p>}
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {note.createdBy?.name} · {formatRelativeTime(new Date(note.createdAt))}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Messages tab */}
            {activeTab === 'Messages' && (
              <div className="flex flex-col gap-2">
                <div className="space-y-2">
                  {(lead as any).messages?.map((msg: any) => (
                    <div key={msg.id} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-xs px-3 py-2 rounded-xl text-sm',
                        msg.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                      )}>
                        <p>{msg.body}</p>
                        <p className={cn('text-[10px] mt-1', msg.direction === 'outbound' ? 'text-primary-foreground/60' : 'text-gray-400')}>
                          {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!(lead as any).messages?.length && (
                    <p className="text-sm text-gray-400 text-center py-8">No messages yet. Use the Inbox to chat.</p>
                  )}
                </div>
                <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 sticky bottom-0">
                  <div className="flex gap-2 items-end">
                    <textarea
                      placeholder="Type a message..."
                      className="flex-1 text-sm resize-none focus:outline-none min-h-[40px] max-h-32 text-gray-900 placeholder:text-gray-400"
                      rows={1}
                    />
                    <button className="px-2 py-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reminders tab */}
            {activeTab === 'Reminders' && (
              <div className="space-y-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Reminder
                </button>
                {(lead as any).reminders?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No reminders</p>}
                {(lead as any).reminders?.map((r: any) => (
                  <div key={r.id} className={cn('bg-white rounded-xl border p-3', r.isDone ? 'border-gray-100 opacity-60' : 'border-gray-200')}>
                    <div className="flex items-start gap-2">
                      <Bell className={cn('w-4 h-4 mt-0.5 shrink-0', r.isDone ? 'text-gray-300' : 'text-amber-500')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', r.isDone ? 'line-through text-gray-400' : 'text-gray-900')}>{r.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.dueAt))}
                          · {r.assignedTo?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks tab */}
            {activeTab === 'Tasks' && (
              <div className="space-y-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Task
                </button>
                {(lead as any).tasks?.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No tasks</p>}
                {(lead as any).tasks?.map((task: any) => (
                  <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start gap-2">
                      <CheckSquare className={cn('w-4 h-4 mt-0.5 shrink-0', task.status === 'done' ? 'text-green-500' : 'text-blue-500')} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 capitalize">{task.status}</span>
                          <span className="text-xs text-gray-400">{task.assignedTo?.name}</span>
                          {task.dueAt && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(new Date(task.dueAt))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Orders tab */}
            {activeTab === 'Orders' && (
              <div className="space-y-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center">
                  <Plus className="w-4 h-4" /> Create Order
                </button>
                {orders.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No orders</p>}
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{order.title}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-gray-400">Paid: {formatCurrency(order.paidAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
