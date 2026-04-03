'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Copy, CheckCircle2, Power, X, Webhook } from 'lucide-react'

interface WebhookConfig {
  id: string
  name: string
  secret: string
  isActive: boolean
  totalHits: number
  lastHitAt: string | null
  createdAt: string
}

const WEBHOOK_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/lead` : '/api/webhooks/lead'

export default function WebhooksSettingsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revealedId, setRevealedId] = useState<string | null>(null)

  const { data: webhooks = [], isLoading } = useQuery<WebhookConfig[]>({
    queryKey: ['webhooks-config'],
    queryFn: () => api.get('/api/webhooks-config'),
  })

  const create = useMutation({
    mutationFn: () => api.post('/api/webhooks-config', { name: newName.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks-config'] })
      setShowCreate(false)
      setNewName('')
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/api/webhooks-config/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks-config'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/webhooks-config/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks-config'] }),
  })

  async function copyText(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Capture leads from your website forms</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Webhook
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-2">How to use</p>
        <p className="text-xs leading-relaxed mb-2">
          POST to <code className="bg-blue-100 px-1 rounded font-mono">{WEBHOOK_URL}</code> with header{' '}
          <code className="bg-blue-100 px-1 rounded font-mono">X-Webhook-Secret: &lt;your-secret&gt;</code>
        </p>
        <p className="text-xs font-semibold mb-1">Required JSON body fields:</p>
        <code className="block text-xs bg-blue-100 rounded p-2 font-mono leading-relaxed">
          {'{ "name": "Ravi Sharma", "phone": "+919876543210",\n  "email": "ravi@example.com", "company": "Acme",\n  "source": "website", "utm_source": "google" }'}
        </code>
      </div>

      {/* Webhook list */}
      {isLoading && <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>}

      {!isLoading && webhooks.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Webhook className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">No webhooks yet</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm text-white bg-primary rounded-lg">
            Create your first webhook
          </button>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map((wh) => (
          <div key={wh.id} className={cn('bg-white rounded-xl border p-4', wh.isActive ? 'border-gray-200' : 'border-gray-100 opacity-70')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', wh.isActive ? 'bg-green-500' : 'bg-gray-300')} />
                <span className="text-sm font-semibold text-gray-900">{wh.name}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', wh.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {wh.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggle.mutate({ id: wh.id, isActive: !wh.isActive })}
                  disabled={toggle.isPending}
                  className={cn('p-1.5 rounded-lg disabled:opacity-50', wh.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50')}
                  title={wh.isActive ? 'Disable' : 'Enable'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove.mutate(wh.id)}
                  disabled={remove.isPending}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Secret */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Secret Key</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRevealedId(revealedId === wh.id ? null : wh.id)}
                    className="text-xs text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded border border-gray-200 bg-white"
                  >
                    {revealedId === wh.id ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={() => copyText(wh.secret, wh.id + '-secret')}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded border border-gray-200 bg-white"
                  >
                    {copiedId === wh.id + '-secret' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
              </div>
              <code className="text-xs font-mono text-gray-700 break-all">
                {revealedId === wh.id ? wh.secret : '•'.repeat(Math.min(wh.secret.length, 32))}
              </code>
            </div>

            {/* Endpoint */}
            <div className="mt-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Endpoint URL</span>
                <button
                  onClick={() => copyText(WEBHOOK_URL, wh.id + '-url')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded border border-gray-200 bg-white"
                >
                  {copiedId === wh.id + '-url' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <code className="text-xs font-mono text-gray-600 break-all">{WEBHOOK_URL}</code>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{wh.totalHits} hits</span>
              {wh.lastHitAt && (
                <span>Last hit: {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(wh.lastHitAt))}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">New Webhook</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Homepage Contact Form"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && create.mutate()}
              />
              <p className="text-xs text-gray-400 mt-2">A unique secret key will be generated automatically.</p>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !newName.trim()}
                className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
