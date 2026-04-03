export default function GA4SettingsPage() {
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            GA4 Measurement ID
            <span className="text-xs text-gray-400 font-normal ml-2">Format: G-XXXXXXXXXX</span>
          </label>
          <input
            type="text"
            placeholder="G-XXXXXXXXXX"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Secret
            <span className="text-xs text-gray-400 font-normal ml-2">From GA4 Admin → Data Streams → Measurement Protocol API secrets</span>
          </label>
          <input
            type="password"
            placeholder="••••••••••••••••"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="pt-2">
          <button className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
            Save Configuration
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Events that will be sent</p>
        <div className="space-y-1.5">
          {[
            'lead_created', 'lead_assigned', 'lead_won', 'lead_lost',
            'whatsapp_message_sent', 'followup_scheduled',
            'order_created', 'payment_received', 'stage_moved',
          ].map((evt) => (
            <div key={evt} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <code className="text-xs text-gray-600">{evt}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
