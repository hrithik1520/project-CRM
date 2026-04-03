'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, List, LayoutGrid, Filter, Phone } from 'lucide-react'
import Link from 'next/link'
import { useLeads, useUpdateLead, type Lead } from '@/lib/hooks/use-leads'
import { usePipelines, type Stage, type Pipeline } from '@/lib/hooks/use-pipelines'
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

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

export default function LeadsPage() {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [activePipelineId, setActivePipelineId] = useState<string | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: pipelines, isLoading: loadingPipelines } = usePipelines()
  const activePipeline: Pipeline | undefined = pipelines?.find((p) => p.id === activePipelineId) ?? pipelines?.[0]

  const { data: leadsData, isLoading: loadingLeads } = useLeads({ pipelineId: activePipeline?.id, pageSize: 200 })
  const leads = leadsData?.data ?? []

  const updateLead = useUpdateLead('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

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

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isLoading ? '…' : `${leadsData?.total ?? 0} total leads`}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pipeline selector */}
          {pipelines && pipelines.length > 1 && (
            <select
              value={activePipeline?.id}
              onChange={(e) => setActivePipelineId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-700 bg-white"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('board')} className={cn('px-3 py-2', view === 'board' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-2', view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50')}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>
      )}

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
                  onAddLead={() => {}}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead && <LeadCard lead={activeLead} isDragging />}
            </DragOverlay>
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.contact.name}
                      </div>
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
    </div>
  )
}
