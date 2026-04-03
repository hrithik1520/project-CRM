'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Phone, ChevronDown, Plus, Clock,
  Bell, CheckSquare, ShoppingBag, Activity,
  ArrowLeft, Edit, Wifi, X, Trash2, Check,
} from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLead, useUpdateLead, useLeadNotes, useAddLeadNote, useLeadActivity } from '@/lib/hooks/use-leads'
import { useOrders } from '@/lib/hooks/use-orders'
import { usePipelines } from '@/lib/hooks/use-pipelines'
import { useConversations, useConversation, useSendMessage } from '@/lib/hooks/use-conversations'
import { api } from '@/lib/api/client'
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

// ── Inline reminder modal (scoped to this lead) ───────────────────────────────
function AddReminderModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })
  const [assignedToId, setAssignedToId] = useState('')

  const create = useMutation({
    mutationFn: () => api.post(`/api/leads/${leadId}/reminders`, {
      title: title.trim(),
      dueAt: new Date(dueAt).toISOString(),
      ...(assignedToId && { assignedToId }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads', leadId] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Add Reminder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up call" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time *</label>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Me</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => create.mutate()} disabled={create.isPending || !title.trim() || !dueAt} className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {create.isPending ? 'Saving…' : 'Add Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline task modal (scoped to this lead) ───────────────────────────────────
function AddTaskModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [priority, setPriority] = useState('medium')
  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })
  const [assignedToId, setAssignedToId] = useState('')

  const create = useMutation({
    mutationFn: () => api.post(`/api/leads/${leadId}/tasks`, {
      title: title.trim(),
      ...(dueAt && { dueAt: new Date(dueAt).toISOString() }),
      ...(assignedToId && { assignedToId }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads', leadId] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send proposal" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Me</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => create.mutate()} disabled={create.isPending || !title.trim()} className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {create.isPending ? 'Saving…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inline order modal (scoped to this lead) ──────────────────────────────────
function CreateOrderModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([{ name: '', quantity: 1, unitPrice: 0 }])

  const create = useMutation({
    mutationFn: () => api.post('/api/orders', {
      title: title.trim(),
      leadId: lead.id,
      contactId: lead.contact.id,
      items: items.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), quantity: i.quantity, unitPrice: i.unitPrice })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); onClose() },
  })

  function updateItem(i: number, field: string, value: any) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Create Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bulk T-shirts — June 2026" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" autoFocus />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            Lead: <span className="font-medium">{lead.title}</span> · Contact: <span className="font-medium">{lead.contact.name}</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items *</label>
              <button onClick={() => setItems([...items, { name: '', quantity: 1, unitPrice: 0 }])} className="text-xs text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} placeholder="Item name" className="flex-1 h-9 px-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} min={1} className="w-14 h-9 px-2 rounded-lg border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="₹" className="w-24 h-9 px-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
            {total > 0 && <div className="flex justify-end mt-2 text-sm font-semibold text-gray-900">Total: {formatCurrency(total)}</div>}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !title.trim() || !items.some((i) => i.name.trim() && i.unitPrice > 0)}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Lead modal ───────────────────────────────────────────────────────────
function EditLeadModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const qc = useQueryClient()
  const updateLead = useUpdateLead(lead.id)
  const { data: pipelines = [] } = usePipelines()
  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })

  const [title, setTitle] = useState(lead.title)
  const [source, setSource] = useState(lead.source ?? '')
  const [score, setScore] = useState(String(lead.score))
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? '')

  async function handleSave() {
    await updateLead.mutateAsync({
      title: title.trim(),
      source: source.trim() || undefined,
      score: parseInt(score) || 0,
      ...(assignedToId && { assignedToId }),
    } as any)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Unassigned</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="referral, ads…" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score (0–100)</label>
              <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={updateLead.isPending || !title.trim()} className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {updateLead.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stage picker dropdown ─────────────────────────────────────────────────────
function StagePicker({ lead, onClose }: { lead: any; onClose: () => void }) {
  const updateLead = useUpdateLead(lead.id)
  const { data: pipelines = [] } = usePipelines()
  const pipeline = pipelines.find((p) => p.id === lead.pipelineId)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
      {pipeline?.stages?.map((stage) => (
        <button
          key={stage.id}
          onClick={() => { updateLead.mutate({ stageId: stage.id } as any); onClose() }}
          className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left', stage.id === lead.stageId && 'bg-primary/5')}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? '#94a3b8' }} />
          <span className="flex-1">{stage.name}</span>
          {stage.id === lead.stageId && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>
      ))}
    </div>
  )
}

// ── Assignee picker dropdown ──────────────────────────────────────────────────
function AssigneePicker({ lead, onClose }: { lead: any; onClose: () => void }) {
  const updateLead = useUpdateLead(lead.id)
  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
      <button
        onClick={() => { updateLead.mutate({ assignedToId: null } as any); onClose() }}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-500"
      >
        Unassigned
      </button>
      {users.map((u: any) => (
        <button
          key={u.id}
          onClick={() => { updateLead.mutate({ assignedToId: u.id } as any); onClose() }}
          className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-left', u.id === lead.assignedToId && 'bg-primary/5')}
        >
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold shrink-0">{u.name.charAt(0)}</div>
          <span className="flex-1">{u.name}</span>
          {u.id === lead.assignedToId && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const params = useParams()
  const leadId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('Activity')
  const [newNote, setNewNote] = useState('')

  // Modals
  const [showEdit, setShowEdit] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showStagePicker, setShowStagePicker] = useState(false)
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)

  const { data: lead, isLoading } = useLead(leadId)
  const { data: activity = [] } = useLeadActivity(leadId)
  const { data: notes = [] } = useLeadNotes(leadId)
  const { data: ordersData } = useOrders({ leadId })
  const orders = ordersData?.data ?? []
  const addNote = useAddLeadNote(leadId)
  const updateLead = useUpdateLead(leadId)

  // Conversations
  const { data: conversationsData } = useConversations({ leadId, pageSize: 10 })
  const firstConversation = conversationsData?.data?.[0]
  const { data: activeConversation } = useConversation(firstConversation?.id ?? '')
  const messages = activeConversation?.messages ?? []
  const [msgBody, setMsgBody] = useState('')
  const sendMessage = useSendMessage(firstConversation?.id ?? '')

  async function handleAddNote() {
    if (!newNote.trim()) return
    await addNote.mutateAsync(newNote.trim())
    setNewNote('')
  }

  async function handleSendMessage() {
    if (!msgBody.trim() || !firstConversation) return
    await sendMessage.mutateAsync({ body: msgBody.trim() })
    setMsgBody('')
  }

  if (isLoading) return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm text-gray-500">Lead not found</p>
        <Link href="/leads" className="text-sm text-blue-600 hover:underline">Back to leads</Link>
      </div>
    )
  }

  const tags = lead.leadTags.map((lt) => lt.tag.name)
  const leadReminders: any[] = (lead as any).reminders ?? []
  const leadTasks: any[] = (lead as any).tasks ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <Link href="/leads" className="text-gray-400 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{lead.title}</h1>
          <p className="text-sm text-gray-500">{lead.contact.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.stage.color ?? '#94a3b8' }} />
            {lead.stage.name}
          </span>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4 space-y-4">
          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {lead.contact.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{lead.contact.name}</p>
                <p className="text-xs text-gray-500">{lead.contact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.contact.phone}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>{t}</span>
              ))}
            </div>
          </div>

          {/* Pipeline Stage — clickable */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pipeline Stage</p>
            <div className="relative">
              <button
                onClick={() => setShowStagePicker(!showStagePicker)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.stage.color ?? '#94a3b8' }} />
                  {lead.stage.name}
                </span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', showStagePicker && 'rotate-180')} />
              </button>
              {showStagePicker && <StagePicker lead={lead} onClose={() => setShowStagePicker(false)} />}
            </div>
          </div>

          {/* Assigned To — clickable */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Assigned To</p>
            <div className="relative">
              <button
                onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                  {(lead.assignedTo?.name ?? '?').charAt(0)}
                </div>
                <span className="flex-1 text-left text-gray-700">{lead.assignedTo?.name ?? 'Unassigned'}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', showAssigneePicker && 'rotate-180')} />
              </button>
              {showAssigneePicker && <AssigneePicker lead={lead} onClose={() => setShowAssigneePicker(false)} />}
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
              {firstConversation ? (
                <button
                  onClick={() => { setActiveTab('Messages') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <Wifi className="w-4 h-4" /> Open Chat
                </button>
              ) : (
                <Link
                  href="/inbox"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <Wifi className="w-4 h-4" /> Send WhatsApp
                </Link>
              )}
              <button
                onClick={() => setShowAddReminder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Bell className="w-4 h-4 text-amber-500" /> Add Reminder
              </button>
              <button
                onClick={() => setShowCreateOrder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ShoppingBag className="w-4 h-4 text-blue-500" /> Create Order
              </button>
              <button
                onClick={() => updateLead.mutate({ status: 'won' } as any)}
                disabled={lead.status === 'won'}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-40"
              >
                Mark Won
              </button>
              <button
                onClick={() => updateLead.mutate({ status: 'lost' } as any)}
                disabled={lead.status === 'lost'}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-40"
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
                      <p className="text-xs text-gray-400 mt-0.5">{entry.user?.name} · {formatRelativeTime(new Date(entry.createdAt))}</p>
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
                    <p className="text-xs text-gray-400 mt-2">{note.createdBy?.name} · {formatRelativeTime(new Date(note.createdAt))}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Messages tab */}
            {activeTab === 'Messages' && (
              <div className="flex flex-col gap-2">
                {!firstConversation ? (
                  <div className="text-center py-10">
                    <Wifi className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">No WhatsApp conversation yet</p>
                    <p className="text-xs text-gray-400">Messages will appear here once the contact sends a WhatsApp message</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                      <span className="font-medium">{activeConversation?.whatsappAccount?.name}</span>
                      <span>·</span>
                      <span>{activeConversation?.contact?.phone}</span>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {messages.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No messages yet</p>}
                      {[...messages].reverse().map((msg) => (
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
                    </div>
                    <div className="mt-3 bg-white rounded-xl border border-gray-200 p-3 sticky bottom-0">
                      <div className="flex gap-2 items-end">
                        <textarea
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                          placeholder="Type a message…"
                          className="flex-1 text-sm resize-none focus:outline-none min-h-[40px] max-h-32 text-gray-900 placeholder:text-gray-400"
                          rows={1}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sendMessage.isPending || !msgBody.trim()}
                          className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reminders tab */}
            {activeTab === 'Reminders' && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Reminder
                </button>
                {leadReminders.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No reminders</p>}
                {leadReminders.map((r: any) => (
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
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
                {leadTasks.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No tasks</p>}
                {leadTasks.map((task: any) => (
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
                              <Clock className="w-3 h-3" />{formatRelativeTime(new Date(task.dueAt))}
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
                <button
                  onClick={() => setShowCreateOrder(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 w-full justify-center"
                >
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
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>{order.status}</span>
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

      {/* Modals */}
      {showEdit && <EditLeadModal lead={lead} onClose={() => setShowEdit(false)} />}
      {showAddReminder && <AddReminderModal leadId={leadId} onClose={() => setShowAddReminder(false)} />}
      {showAddTask && <AddTaskModal leadId={leadId} onClose={() => setShowAddTask(false)} />}
      {showCreateOrder && <CreateOrderModal lead={lead} onClose={() => setShowCreateOrder(false)} />}
    </div>
  )
}
