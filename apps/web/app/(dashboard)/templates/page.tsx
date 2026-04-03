'use client'

import { useState } from 'react'
import { Plus, FileText, Edit, Trash2, Copy, X } from 'lucide-react'
import { DUMMY_TEMPLATES } from '@/lib/dummy-data'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  intro: 'bg-blue-100 text-blue-700',
  'follow-up': 'bg-amber-100 text-amber-700',
  proposal: 'bg-purple-100 text-purple-700',
  payment: 'bg-green-100 text-green-700',
  order: 'bg-teal-100 text-teal-700',
  general: 'bg-gray-100 text-gray-600',
}

const CATEGORIES = ['All', 'intro', 'follow-up', 'proposal', 'payment', 'order'] as const

export default function TemplatesPage() {
  const [category, setCategory] = useState<string>('All')
  const [showForm, setShowForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<(typeof DUMMY_TEMPLATES)[0] | null>(null)

  const filtered = category === 'All'
    ? DUMMY_TEMPLATES
    : DUMMY_TEMPLATES.filter((t) => t.category === category)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Reusable WhatsApp message templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 px-6 py-3 border-b border-gray-200 bg-white overflow-x-auto shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-colors',
              category === cat ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tpl.name}</p>
                    {tpl.shortcut && (
                      <p className="text-xs text-gray-400 font-mono">{tpl.shortcut}</p>
                    )}
                  </div>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', CATEGORY_COLORS[tpl.category] ?? 'bg-gray-100 text-gray-600')}>
                  {tpl.category}
                </span>
              </div>

              {/* Body preview */}
              <p className="text-sm text-gray-600 flex-1 leading-relaxed line-clamp-3">
                {tpl.body}
              </p>

              {/* Variables */}
              {tpl.body.match(/\{\{[\w_]+\}\}/g) && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {[...new Set(tpl.body.match(/\{\{([\w_]+)\}\}/g) ?? [])].map((v) => (
                    <span key={v} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-500">
                      {v}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setEditTemplate(tpl); setShowForm(true) }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors min-h-[180px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">New Template</span>
          </button>
        </div>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditTemplate(null) }} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
                <input
                  type="text"
                  defaultValue={editTemplate?.name}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Welcome Message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  defaultValue={editTemplate?.category}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="intro">Intro</option>
                  <option value="follow-up">Follow Up</option>
                  <option value="proposal">Proposal</option>
                  <option value="payment">Payment</option>
                  <option value="order">Order</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message Body
                  <span className="text-xs font-normal text-gray-400 ml-2">Use {'{{variable}}'} for dynamic content</span>
                </label>
                <textarea
                  defaultValue={editTemplate?.body}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Hi {{contact_name}}, ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quick Reply Shortcut
                  <span className="text-xs font-normal text-gray-400 ml-2">optional, e.g. /intro</span>
                </label>
                <input
                  type="text"
                  defaultValue={editTemplate?.shortcut}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  placeholder="/shortcut"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button onClick={() => { setShowForm(false); setEditTemplate(null) }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
                {editTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
