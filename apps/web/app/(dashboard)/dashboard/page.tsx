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
import { DUMMY_SESSIONS, DUMMY_REMINDERS, DUMMY_TASKS, DUMMY_ACTIVITY, DUMMY_STAGES } from '@/lib/dummy-data'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STAT_CARDS = [
  { label: 'Total Active Leads', value: '26', delta: '+4 this week', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'New Leads Today', value: '3', delta: '+1 since yesterday', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Won This Month', value: '9', delta: '₹3.2L revenue', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Revenue This Month', value: '₹4,65,000', delta: '+18% vs last month', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
]

function SessionBadge({ session }: { session: (typeof DUMMY_SESSIONS)[0] }) {
  const icon = {
    connected: <Wifi className="w-4 h-4 text-green-600" />,
    disconnected: <WifiOff className="w-4 h-4 text-red-500" />,
    requires_reauth: <AlertCircle className="w-4 h-4 text-amber-500" />,
  }[session.status]

  const label = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    requires_reauth: 'Needs Reauth',
  }[session.status]

  const colors = {
    connected: 'border-green-200 bg-green-50',
    disconnected: 'border-red-200 bg-red-50',
    requires_reauth: 'border-amber-200 bg-amber-50',
  }[session.status]

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border', colors)}>
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-900">{session.name}</p>
          <p className="text-xs text-gray-500">{session.phone}</p>
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
    payment_updated: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  }
  return (
    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      {icons[type] ?? <Clock className="w-3.5 h-3.5 text-gray-400" />}
    </div>
  )
}

export default function DashboardPage() {
  const dueToday = DUMMY_REMINDERS.filter((r) => !r.isDone && r.dueAt <= new Date(Date.now() + 8 * 3600000))
  const overdue = DUMMY_REMINDERS.filter((r) => !r.isDone && r.dueAt < new Date())

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
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.delta}</p>
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
            {DUMMY_STAGES.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate">{stage.name}</span>
                    <span className="text-xs font-medium text-gray-900 ml-2">{stage.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(stage.count / 10) * 100}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
            {DUMMY_SESSIONS.map((session) => (
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
          {overdue.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs font-medium text-red-700">{overdue.length} overdue reminder{overdue.length > 1 ? 's' : ''}</p>
            </div>
          )}
          <div className="space-y-2">
            {dueToday.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Nothing due today 🎉</p>
            )}
            {dueToday.map((r) => (
              <div key={r.id} className="flex gap-2.5 p-2 rounded-lg hover:bg-gray-50">
                <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{r.note}</p>
                  <p className="text-xs text-gray-500">{r.contactName} · {new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(r.dueAt)}</p>
                </div>
              </div>
            ))}
            {DUMMY_TASKS.filter((t) => t.status !== 'done').slice(0, 2).map((task) => (
              <div key={task.id} className="flex gap-2.5 p-2 rounded-lg hover:bg-gray-50">
                <CheckSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.leadTitle} · {task.assignedTo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {DUMMY_ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <ActivityIcon type={item.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {item.user} · {formatRelativeTime(item.time)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
