'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

export default function GA4SettingsPage() {
  const { data, isLoading } = useQuery<{ measurementId: string; apiSecret: string; configured: boolean }>({
    queryKey: ['ga4-config'],
    queryFn: () => api.get('/api/settings/ga4'),
  })

  const [measurementId, setMeasurementId] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setMeasurementId(data.measurementId)
      setApiSecret(data.apiSecret)
    }
  }, [data])

  const save = useMutation({
    mutationFn: () => api.put('/api/settings/ga4', { measurementId, apiSecret }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Google Analytics 4</h1>
      <p className="text-sm text-gray-500 mb-6">Send CRM events to GA4 via Measurement Protocol</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">How this works</p>
        <p className="text-xs leading-relaxed">
          CRM events (lead created, order placed, payment received, etc.) are sent to GA4 using the
          Measurement Protocol API. This requires your website to pass the GA4 <code>client_id</code> (from
          the <code>_ga</code> cookie) when submitting lead forms — otherwise events will appear as direct traffic.
        </p>
      </div>

      <div className={cn('bg-white rounded-xl border p-5 space-y-4', data?.configured ? 'border-green-200' : 'border-gray-200')}>
        {data?.configured && (
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            GA4 is configured and active
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            GA4 Measurement ID
            <span className="text-xs text-gray-400 font-normal ml-2">Format: G-XXXXXXXXXX</span>
          </label>
          <input
            type="text"
            value={measurementId}
            onChange={(e) => setMeasurementId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            disabled={isLoading}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Secret
            <span className="text-xs text-gray-400 font-normal ml-2">From GA4 Admin → Data Streams → Measurement Protocol API secrets</span>
          </label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="••••••••••••••••"
            disabled={isLoading}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !measurementId.trim()}
            className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save Configuration'}
          </button>
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Events that will be sent</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            'lead_created', 'lead_assigned', 'lead_won', 'lead_lost',
            'whatsapp_message_sent', 'followup_scheduled',
            'order_created', 'payment_received', 'stage_moved',
          ].map((evt) => (
            <div key={evt} className="flex items-center gap-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', data?.configured ? 'bg-green-500' : 'bg-gray-300')} />
              <code className="text-xs text-gray-600">{evt}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
