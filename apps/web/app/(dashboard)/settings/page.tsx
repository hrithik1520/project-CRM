import Link from 'next/link'
import { Kanban, Users, MessageSquare, BarChart2, Webhook, ChevronRight } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    href: '/settings/pipeline',
    icon: Kanban,
    title: 'Pipelines & Stages',
    description: 'Customize pipeline names and stage order',
  },
  {
    href: '/settings/team',
    icon: Users,
    title: 'Team Members',
    description: 'Invite users, assign roles, manage access',
  },
  {
    href: '/settings/whatsapp',
    icon: MessageSquare,
    title: 'WhatsApp Sessions',
    description: 'Connect and manage WhatsApp numbers via QR',
  },
  {
    href: '/settings/ga4',
    icon: BarChart2,
    title: 'Google Analytics',
    description: 'Configure GA4 Measurement ID for CRM events',
  },
  {
    href: '/settings/webhooks',
    icon: Webhook,
    title: 'Webhooks',
    description: 'Inbound lead capture from website forms',
  },
]

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Configure your CRM workspace</p>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <section.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{section.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
