'use client'

import { useState } from 'react'
import { Wifi, WifiOff, AlertCircle, Plus, QrCode, Trash2, RefreshCw, X } from 'lucide-react'
import { DUMMY_SESSIONS } from '@/lib/dummy-data'
import { cn, formatRelativeTime } from '@/lib/utils'

export default function WhatsAppSettingsPage() {
  const [showQRModal, setShowQRModal] = useState(false)
  const [connectingSession, setConnectingSession] = useState<string | null>(null)

  function handleConnect(sessionId: string) {
    setConnectingSession(sessionId)
    setShowQRModal(true)
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
    }
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', styles[status] ?? 'bg-gray-100 text-gray-600')}>
        {status.replace('_', ' ')}
      </span>
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
          onClick={() => setShowQRModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Number
        </button>
      </div>

      {/* Risk notice */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠ Important Notice</p>
        <p className="text-xs leading-relaxed">
          This uses unofficial WhatsApp Web automation. Account bans are possible. Use only for genuine 1-to-1 business conversations.
          Keep message rates low. See <strong>risks.md</strong> for full details.
        </p>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {DUMMY_SESSIONS.map((session) => (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  session.status === 'connected' ? 'bg-green-100' : session.status === 'requires_reauth' ? 'bg-amber-100' : 'bg-red-100'
                )}>
                  <StatusIcon status={session.status} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.name}</p>
                  <p className="text-xs text-gray-500">{session.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={session.status} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Last connected: {formatRelativeTime(session.lastConnected)}
              </p>
              <div className="flex items-center gap-2">
                {session.status !== 'connected' && (
                  <button
                    onClick={() => handleConnect(session.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {session.status === 'requires_reauth' ? 'Re-authenticate' : 'Connect'}
                  </button>
                )}
                {session.status === 'connected' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restart
                  </button>
                )}
                <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Connect WhatsApp</h2>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              {/* QR placeholder */}
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <QrCode className="w-16 h-16 text-gray-300" />
                <span className="sr-only">QR code loading...</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">Scan with WhatsApp</p>
              <ol className="text-xs text-gray-500 text-left space-y-1 bg-gray-50 rounded-lg p-3">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Tap Settings → Linked Devices</li>
                <li>3. Tap "Link a Device"</li>
                <li>4. Scan this QR code</li>
              </ol>
              <p className="text-xs text-gray-400 mt-3">QR refreshes automatically every 60 seconds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
