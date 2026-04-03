'use client'

import {
  TrendingUp,
  Users,
  CheckCircle2,
  IndianRupee,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  Bell,
  CheckSquare,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type SessionStatus = 'connected' | 'disconnected' | 'requires_reauth' | string

function SessionBadge({ session }: { session: { id: string; status: SessionStatus; whatsappAccount: { name: string; phoneNumber: string } } }) {
  const icon = session.status === 'connected'
    ? <Wifi className="w-4 h-4 text-green-600" />
    : session.status === 'requires_reauth'
    ? <AlertCircle className="w-4 h-4 text-amber-500" />
    : <WifiOff className="w-4 h-4 text-red-500" />

  const label = session.status === 'connected' ? 'Connected' : session.status === 'requires_reauth' ? 'Needs Reauth' : 'Disconnected'

  const colors = session.status === 'connected'
    ? 'border-green-200 bg-green-50'
    : session.status === 'requires_reauth'
    ? 'border-amber-200 bg-amber-50'
    : 'border-red-200 bg-red-50'

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border', colors)}>
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900">{session.whatsappAccount.name}</p>
          <p className="text-xs text-gray-500">{session.whatsappAccount.phoneNumber}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    message_sent: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,
    lead_created: <Users className="w-3.5 h-3.5 text-purple-500" />,
    stage_moved: <ArrowRight className="w-3.5 h-3.5 text-amber-500" />,
    order_created: <IndianRupee className="w-3.5 h-3.5 text-green-500" />,
    payment_received: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  }
  return (
    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      {icons[type] ?? <Clock className="w-3.5 h-3.5 text-gray-400" />}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboard()

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Leads',
            value: isLoading ? '—' : String(stats?.leads.active ?? 0),
            delta: isLoading ? '' : `+${stats?.leads.newThisMonth ?? 0} this month`,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Won This Month',
            value: isLoading ? '—' : String(stats?.leads.won ?? 0),
            delta: '',
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Lost This Month',
            value: isLoading ? '—' : String(stats?.leads.lost ?? 0),
            delta: '',
            icon: Users,
            color: 'text-red-500',
            bg: 'bg-red-50',
          },
          {
            label: 'Revenue This Month',
            value: isLoading ? '—' : formatCurrency(stats?.revenue.thisMonth ?? 0),
            delta: isLoading ? '' : `Total: ${formatCurrency(stats?.revenue.total ?? 0)}`,
            icon: IndianRupee,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.delta && <p className="text-xs text-gray-500 mt-1">{stat.delta}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Pipeline Summary</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading && <p className="text-xs text-gray-400 text-center py-4">Loading…</p>}
            {stats?.pipelineSummary.map((stage) => {
              const max = Math.max(...(stats.pipelineSummary.map((s) => s._count.leads)), 1)
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-blue-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700 truncate">{stage.name}</span>
                      <span className="text-xs font-medium text-gray-900 ml-2">{stage._count.leads}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${(stage._count.leads / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* WhatsApp sessions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">WhatsApp Sessions</h2>
            <Link href="/settings/whatsapp" className="text-xs text-blue-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading && <p className="text-xs text-gray-400 text-center py-4">Loading…</p>}
            {!isLoading && !stats?.whatsappSessions.length && (
              <p className="text-xs text-gray-500 text-center py-4">No sessions configured</p>
            )}
            {stats?.whatsappSessions.map((session) => (
              <SessionBadge key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Due today */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Due Today</h2>
            <Link href="/reminders" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {!isLoading && (stats?.overdue.reminders ?? 0) > 0 && (
            <div className="mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-medium text-red-700">
                {stats!.overdue.reminders} overdue reminder{stats!.overdue.reminders > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {isLoading && <p className="text-xs text-gray-400 text-center py-4">Loading…</p>}
          {!isLoading && (stats?.dueToday.reminders ?? 0) === 0 && (stats?.dueToday.tasks ?? 0) === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">Nothing due today 🎉</p>
          )}
          <div className="space-y-2">
            {!isLoading && (stats?.dueToday.reminders ?? 0) > 0 && (
              <div className="flex gap-2.5 p-2 rounded-lg bg-amber-50">
                <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-gray-900">
                  {stats!.dueToday.reminders} reminder{stats!.dueToday.reminders > 1 ? 's' : ''} due today
                </p>
              </div>
            )}
            {!isLoading && (stats?.dueToday.tasks ?? 0) > 0 && (
              <div className="flex gap-2.5 p-2 rounded-lg bg-blue-50">
                <CheckSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-gray-900">
                  {stats!.dueToday.tasks} task{stats!.dueToday.tasks > 1 ? 's' : ''} due today
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
        </div>
        {isLoading && <p className="text-xs text-gray-400 text-center py-4">Loading…</p>}
        <div className="space-y-3">
          {stats?.recentActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <ActivityIcon type={item.action} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {item.user.name} · {formatRelativeTime(new Date(item.createdAt))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
