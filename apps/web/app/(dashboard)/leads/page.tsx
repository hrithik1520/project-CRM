'use client'

import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, List, LayoutGrid, Filter, Phone, X, Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLeads, useCreateLead, useUpdateLead, type Lead } from '@/lib/hooks/use-leads'
import { usePipelines, type Stage, type Pipeline } from '@/lib/hooks/use-pipelines'
import { api } from '@/lib/api/client'
import { cn, formatRelativeTime } from '@/lib/utils'

const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
  vip: 'bg-purple-100 text-purple-700',
  'bulk-order': 'bg-green-100 text-green-700',
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-gray-300'
  return <div className={cn('w-2 h-2 rounded-full', color)} title={`Score: ${score}`} />
}

function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: lead.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortableDragging ? 0.4 : 1 }
  const tags = lead.leadTags.map((lt) => lt.tag.name)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:border-gray-300 hover:shadow-sm transition-all',
        isDragging && 'shadow-lg rotate-1'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 leading-tight line-clamp-2 cursor-pointer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {lead.title}
        </Link>
        <ScoreDot score={lead.score} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
        <Phone className="w-3 h-3" />
        <span className="truncate">{lead.contact.name}</span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag) => (
            <span key={tag} className={cn('px-1.5 py-0.5 rounded text-xs font-medium', TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600')}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-[10px]">
            {(lead.assignedTo?.name ?? '?').charAt(0)}
          </div>
          <span>{lead.assignedTo?.name ?? 'Unassigned'}</span>
        </div>
        <span>{formatRelativeTime(new Date(lead.createdAt))}</span>
      </div>
    </div>
  )
}

function StageColumn({ stage, leads, onAddLead }: { stage: Stage; leads: Lead[]; onAddLead: (stageId: string) => void }) {
  return (
    <div className="flex flex-col w-[280px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color ?? '#94a3b8' }} />
        <span className="text-sm font-semibold text-gray-900">{stage.name}</span>
        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[200px] p-2 rounded-xl bg-gray-50 border border-gray-200/50">
          {leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-gray-400">No leads</div>
          )}
        </div>
      </SortableContext>
      <button
        onClick={() => onAddLead(stage.id)}
        className="mt-2 flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add lead
      </button>
    </div>
  )
}

// ── New Lead Modal ────────────────────────────────────────────────────────────

interface NewLeadModalProps {
  pipeline: Pipeline
  defaultStageId?: string
  onClose: () => void
}

function NewLeadModal({ pipeline, defaultStageId, onClose }: NewLeadModalProps) {
  const qc = useQueryClient()
  const createLead = useCreateLead()

  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [contactName, setContactName] = useState('')
  const [stageId, setStageId] = useState(defaultStageId ?? pipeline.stages?.[0]?.id ?? '')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')

  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })
  const [assignedToId, setAssignedToId] = useState('')

  // Contact search by phone
  const [contactId, setContactId] = useState<string | null>(null)
  const { data: contactSearch } = useQuery<any>({
    queryKey: ['contact-search', phone],
    queryFn: () => api.get(`/api/contacts?search=${encodeURIComponent(phone)}&pageSize=5`),
    enabled: phone.length >= 7,
  })
  const foundContact = contactSearch?.data?.[0]

  async function handleSubmit() {
    if (!title.trim() || (!contactId && (!phone.trim() || !contactName.trim()))) return

    let resolvedContactId = contactId
    if (!resolvedContactId) {
      // Create contact on-the-fly
      const newContact = await api.post<any>('/api/contacts', { name: contactName.trim(), phone: phone.trim() })
      resolvedContactId = newContact.id
    }

    await createLead.mutateAsync({
      title: title.trim(),
      contactId: resolvedContactId,
      pipelineId: pipeline.id,
      stageId,
      ...(assignedToId && { assignedToId }),
      ...(source && { source }),
      ...(tags && { tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    } as any)
    onClose()
  }

  // When phone matches existing contact, auto-fill
  function handlePhoneChange(val: string) {
    setPhone(val)
    setContactId(null)
    setContactName('')
  }

  function selectContact(c: any) {
    setContactId(c.id)
    setContactName(c.name)
    setPhone(c.phone)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Lead title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bulk order — Ravi Sharma"
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone *</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {/* Dropdown suggestion */}
              {!contactId && contactSearch?.data?.length > 0 && phone.length >= 7 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {contactSearch.data.slice(0, 4).map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => selectContact(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{c.name.charAt(0)}</div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {contactId ? (
              <p className="text-xs text-green-600 mt-1">✓ Existing contact: {contactName}</p>
            ) : (
              <div className="mt-2">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contact name (new contact)"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stage</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {pipeline.stages?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Assigned to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Unassigned</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* Source + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. referral"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hot, vip (comma-separated)"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={createLead.isPending || !title.trim() || (!contactId && (!phone.trim() || !contactName.trim()))}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {createLead.isPending ? 'Creating…' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filters panel ─────────────────────────────────────────────────────────────

interface Filters { search: string; status: string; assignedToId: string }

function FilterBar({ filters, onChange, users }: { filters: Filters; onChange: (f: Filters) => void; users: any[] }) {
  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-200 bg-white shrink-0 flex-wrap">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search leads…"
          className="h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
        />
      </div>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="h-8 px-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
        <option value="stale">Stale</option>
      </select>
      <select
        value={filters.assignedToId}
        onChange={(e) => onChange({ ...filters, assignedToId: e.target.value })}
        className="h-8 px-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none"
      >
        <option value="">All agents</option>
        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      {(filters.search || filters.status || filters.assignedToId) && (
        <button
          onClick={() => onChange({ search: '', status: '', assignedToId: '' })}
          className="h-8 px-2 text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [activePipelineId, setActivePipelineId] = useState<string | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLeadStageId, setNewLeadStageId] = useState<string | undefined>()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', assignedToId: '' })

  const { data: pipelines, isLoading: loadingPipelines } = usePipelines()
  const activePipeline: Pipeline | undefined = pipelines?.find((p) => p.id === activePipelineId) ?? pipelines?.[0]

  const { data: users = [] } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/api/users') })

  const activeFilters = { pipelineId: activePipeline?.id, pageSize: 200, ...filters }
  const { data: leadsData, isLoading: loadingLeads } = useLeads(activeFilters)
  const leads = leadsData?.data ?? []

  const updateLead = useUpdateLead('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string) }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const activeLead = leads.find((l) => l.id === active.id)
    if (!activeLead) return
    const overLead = leads.find((l) => l.id === over.id)
    const stages = activePipeline?.stages ?? []
    const isStage = stages.some((s) => s.id === over.id)
    const targetStageId = isStage ? (over.id as string) : overLead?.stageId
    if (targetStageId && targetStageId !== activeLead.stageId) {
      updateLead.mutate({ stageId: targetStageId } as any)
    }
  }

  const activeLead = leads.find((l) => l.id === activeId)
  const stages = activePipeline?.stages ?? []
  const isLoading = loadingPipelines || loadingLeads
  const hasActiveFilters = !!(filters.search || filters.status || filters.assignedToId)

  function openNewLead(stageId?: string) {
    setNewLeadStageId(stageId)
    setShowNewLead(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isLoading ? '…' : `${leadsData?.total ?? 0} total leads`}</p>
        </div>
        <div className="flex items-center gap-2">
          {pipelines && pipelines.length > 1 && (
            <select
              value={activePipeline?.id}
              onChange={(e) => setActivePipelineId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-700 bg-white"
            >
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg',
              hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4" />
            Filter {hasActiveFilters && `(${[filters.search, filters.status, filters.assignedToId].filter(Boolean).length})`}
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('board')} className={cn('px-3 py-2', view === 'board' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-2', view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50')}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => openNewLead()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && <FilterBar filters={filters} onChange={setFilters} users={users} />}

      {isLoading && <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>}

      {/* Board view */}
      {!isLoading && view === 'board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-6 h-full">
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  leads={leads.filter((l) => l.stageId === stage.id)}
                  onAddLead={(stageId) => openNewLead(stageId)}
                />
              ))}
            </div>
            <DragOverlay>{activeLead && <LeadCard lead={activeLead} isDragging />}</DragOverlay>
          </DndContext>
        </div>
      )}

      {/* List view */}
      {!isLoading && view === 'list' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No leads found</td></tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-blue-600">{lead.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600"><Phone className="w-3.5 h-3.5" />{lead.contact.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.stage.color ?? '#94a3b8' }} />
                        {lead.stage.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.assignedTo?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {lead.leadTags.map((lt) => (
                          <span key={lt.tag.id} className={cn('px-1.5 py-0.5 rounded text-xs font-medium', TAG_COLORS[lt.tag.name] ?? 'bg-gray-100 text-gray-600')}>
                            {lt.tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(new Date(lead.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewLead && activePipeline && (
        <NewLeadModal
          pipeline={activePipeline}
          defaultStageId={newLeadStageId}
          onClose={() => setShowNewLead(false)}
        />
      )}
    </div>
  )
}
