'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, Edit, Check, X } from 'lucide-react'
import { DUMMY_STAGES } from '@/lib/dummy-data'
import { cn } from '@/lib/utils'

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState(DUMMY_STAGES)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function startEdit(stage: (typeof DUMMY_STAGES)[0]) {
    setEditingId(stage.id)
    setEditName(stage.name)
  }

  function saveEdit() {
    if (!editingId) return
    setStages((prev) => prev.map((s) => s.id === editingId ? { ...s, name: editName } : s))
    setEditingId(null)
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Pipeline & Stages</h1>
      <p className="text-sm text-gray-500 mb-6">Customize your sales pipeline stage names and order</p>

      {/* Pipeline name */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pipeline Name</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            defaultValue="Sales Pipeline"
            className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">Save</button>
        </div>
      </div>

      {/* Stages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Stages</p>
          <p className="text-xs text-gray-500">Drag to reorder</p>
        </div>
        <div className="divide-y divide-gray-100">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
              {editingId === stage.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 h-8 px-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  />
                  <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
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
                    {(stage as any).isWon && <span className="text-xs text-green-600 font-medium">Won</span>}
                    {(stage as any).isLost && <span className="text-xs text-red-600 font-medium">Lost</span>}
                    <button onClick={() => startEdit(stage)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 w-full justify-center">
        <Plus className="w-4 h-4" /> Add Stage
      </button>
    </div>
  )
}
