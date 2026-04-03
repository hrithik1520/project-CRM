'use client'

import { useState } from 'react'
import { Wifi, WifiOff, AlertCircle, Plus, QrCode, Trash2, RefreshCw, X, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { cn, formatRelativeTime } from '@/lib/utils'

interface WhatsAppSession {
  id: string
  accountId: string
  status: string
  qrCode?: string | null
  lastConnectedAt?: string | null
  errorMessage?: string | null
  account: { id: string; name: string; phoneNumber?: string | null }
}

function useWhatsAppSessions() {
  return useQuery<WhatsAppSession[]>({
    queryKey: ['whatsapp-sessions'],
    queryFn: () => api.get('/api/whatsapp/sessions'),
    refetchInterval: 10000,
  })
}

function useSessionAction(sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: 'start' | 'stop' | 'logout') =>
      api.post(`/api/whatsapp/sessions/${sessionId}?action=${action}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-sessions'] }),
  })
}

function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phoneNumber?: string }) =>
      api.post('/api/whatsapp/accounts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-sessions'] }),
  })
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'connected') return <Wifi className="w-4 h-4 text-green-500" />
  if (status === 'requires_reauth') return <AlertCircle className="w-4 h-4 text-amber-500" />
  return <WifiOff className="w-4 h-4 text-red-400" />
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    connected: 'bg-green-100 text-green-700',
    requires_reauth: 'bg-amber-100 text-amber-700',
    disconnected: 'bg-red-100 text-red-700',
    initializing: 'bg-blue-100 text-blue-700',
    qr: 'bg-purple-100 text-purple-700',
    stopped: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', styles[status] ?? 'bg-gray-100 text-gray-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function SessionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function QRModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ qrDataUrl: string | null; qrExpiresAt: string | null; status?: string }>({
    queryKey: ['whatsapp-qr', sessionId],
    queryFn: () => api.get(`/api/whatsapp/sessions/${sessionId}?action=qr`),
    refetchInterval: (query) => {
      if (query.state.data?.status === 'connected') return false
      return 3000
    },
  })

  const isConnected = data?.status === 'connected'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Connect WhatsApp</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-center">
          {isConnected ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Connected!</p>
              <p className="text-xs text-gray-500">WhatsApp linked successfully</p>
              <button onClick={onClose} className="mt-2 px-4 py-2 text-sm text-white bg-primary rounded-lg">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="w-56 h-56 mx-auto bg-gray-50 rounded-xl flex items-center justify-center mb-4 border border-gray-100">
                {isLoading || !data?.qrDataUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Waiting for QR…</p>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.qrDataUrl} alt="WhatsApp QR Code" className="w-full h-full rounded-xl object-contain" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">Scan with WhatsApp</p>
              <ol className="text-xs text-gray-500 text-left space-y-1 bg-gray-50 rounded-lg p-3">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Tap Settings → Linked Devices</li>
                <li>3. Tap "Link a Device"</li>
                <li>4. Scan this QR code</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">QR refreshes automatically every 60 seconds</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppSettingsPage() {
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const { data: sessions, isLoading } = useWhatsAppSessions()
  const createAccount = useCreateAccount()

  function handleConnect(sessionId: string) {
    setActiveSessionId(sessionId)
    setShowQRModal(true)
  }

  async function handleAddAccount() {
    if (!newName.trim()) return
    await createAccount.mutateAsync({ name: newName.trim(), phoneNumber: newPhone.trim() || undefined })
    setShowAddModal(false)
    setNewName('')
    setNewPhone('')
  }

  const SessionCard = ({ session }: { session: WhatsAppSession }) => {
    const action = useSessionAction(session.id)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              session.status === 'connected' ? 'bg-green-100' : session.status === 'requires_reauth' ? 'bg-amber-100' : 'bg-red-100'
            )}>
              <StatusIcon status={session.status} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{session.account.name}</p>
              <p className="text-xs text-gray-500">{session.account.phoneNumber ?? 'No phone set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={session.status} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {session.lastConnectedAt
              ? `Last connected: ${formatRelativeTime(new Date(session.lastConnectedAt))}`
              : 'Never connected'}
          </p>
          <div className="flex items-center gap-2">
            {session.status !== 'connected' && (
              <button
                onClick={() => { action.mutate('start'); handleConnect(session.id) }}
                disabled={action.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                <QrCode className="w-3.5 h-3.5" />
                {session.status === 'requires_reauth' ? 'Re-authenticate' : 'Connect'}
              </button>
            )}
            {session.status === 'connected' && (
              <button
                onClick={() => action.mutate('stop')}
                disabled={action.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restart
              </button>
            )}
            <button
              onClick={() => action.mutate('logout')}
              disabled={action.isPending}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">WhatsApp Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect WhatsApp numbers via QR code scan</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Number
        </button>
      </div>

      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">Important Notice</p>
        <p className="text-xs leading-relaxed">
          This uses unofficial WhatsApp Web automation. Account bans are possible. Use only for genuine 1-to-1 business conversations.
          Keep message rates low.
        </p>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <SessionSkeleton key={i} />)
          : sessions?.map((session) => <SessionCard key={session.id} session={session} />)}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <WifiOff className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">No WhatsApp sessions yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm text-white bg-primary rounded-lg"
            >
              Add your first number
            </button>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Add WhatsApp Number</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Sales WhatsApp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number (optional)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newName.trim() || createAccount.isPending}
                className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && activeSessionId && (
        <QRModal
          sessionId={activeSessionId}
          onClose={() => { setShowQRModal(false); setActiveSessionId(null) }}
        />
      )}
    </div>
  )
}
