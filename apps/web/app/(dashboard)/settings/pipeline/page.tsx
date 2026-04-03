'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, Edit, Check, X } from 'lucide-react'
import { usePipelines, useCreateStage, useUpdatePipeline } from '@/lib/hooks/use-pipelines'
import { api } from '@/lib/api/client'
import { useQueryClient } from '@tanstack/react-query'

export default function PipelineSettingsPage() {
  const { data: pipelines, isLoading } = usePipelines()
  const defaultPipeline = pipelines?.find((p) => p.isDefault) ?? pipelines?.[0]

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [addingStage, setAddingStage] = useState(false)

  const qc = useQueryClient()
  const updatePipeline = useUpdatePipeline(defaultPipeline?.id ?? '')
  const createStage = useCreateStage(defaultPipeline?.id ?? '')

  async function saveStageEdit() {
    if (!editingId || !editName.trim()) return
    await api.put(`/api/pipelines/${defaultPipeline?.id}/stages/${editingId}`, { name: editName }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['pipelines'] })
    setEditingId(null)
  }

  async function deleteStage(stageId: string) {
    await api.delete(`/api/pipelines/${defaultPipeline?.id}/stages/${stageId}`).catch(() => {})
    qc.invalidateQueries({ queryKey: ['pipelines'] })
  }

  async function addStage() {
    if (!newStageName.trim()) return
    await createStage.mutateAsync({ name: newStageName.trim() })
    setNewStageName('')
    setAddingStage(false)
  }

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  const stages = defaultPipeline?.stages ?? []

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Pipeline & Stages</h1>
      <p className="text-sm text-gray-500 mb-6">Customize your sales pipeline stage names and order</p>

      {/* Pipeline name */}
      {defaultPipeline && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pipeline Name</label>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value
              updatePipeline.mutate({ name })
            }}
            className="flex items-center gap-2"
          >
            <input
              name="name"
              type="text"
              defaultValue={defaultPipeline.name}
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button type="submit" className="px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
              Save
            </button>
          </form>
        </div>
      )}

      {/* Stages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Stages</p>
          <p className="text-xs text-gray-500">{stages.length} stages</p>
        </div>
        <div className="divide-y divide-gray-100">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? '#94a3b8' }} />
              {editingId === stage.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-8 px-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveStageEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  />
                  <button onClick={saveStageEdit} className="text-green-600 hover:text-green-700">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-900">{stage.name}</span>
                  <div className="flex items-center gap-1">
                    {stage.isWon && <span className="text-xs text-green-600 font-medium">Won</span>}
                    {stage.isLost && <span className="text-xs text-red-600 font-medium">Lost</span>}
                    <button
                      onClick={() => { setEditingId(stage.id); setEditName(stage.name) }}
                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteStage(stage.id)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {addingStage ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Stage name…"
            autoFocus
            className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => { if (e.key === 'Enter') addStage(); if (e.key === 'Escape') setAddingStage(false) }}
          />
          <button onClick={addStage} className="px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">Add</button>
          <button onClick={() => setAddingStage(false)} className="p-2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button
          onClick={() => setAddingStage(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm border border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Add Stage
        </button>
      )}
    </div>
  )
}
