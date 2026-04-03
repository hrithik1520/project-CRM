'use client'

import { useState } from 'react'
import { Bell, CheckSquare, Clock, CheckCircle2, Plus, AlertCircle } from 'lucide-react'
import { DUMMY_REMINDERS, DUMMY_TASKS } from '@/lib/dummy-data'
import { cn } from '@/lib/utils'

type ReminderTab = 'Today' | 'Upcoming' | 'Overdue' | 'Done'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
}

const now = new Date()
const todayEnd = new Date(now)
todayEnd.setHours(23, 59, 59, 999)

export default function RemindersPage() {
  const [tab, setTab] = useState<ReminderTab>('Today')

  const remindersToday = DUMMY_REMINDERS.filter((r) => !r.isDone && r.dueAt <= todayEnd && r.dueAt > now)
  const remindersOverdue = DUMMY_REMINDERS.filter((r) => !r.isDone && r.dueAt <= now)
  const remindersUpcoming = DUMMY_REMINDERS.filter((r) => !r.isDone && r.dueAt > todayEnd)
  const remindersDone = DUMMY_REMINDERS.filter((r) => r.isDone)

  const tasksTodo = DUMMY_TASKS.filter((t) => t.status !== 'done')
  const tasksDone = DUMMY_TASKS.filter((t) => t.status === 'done')

  const counts: Record<ReminderTab, number> = {
    Today: remindersToday.length + tasksTodo.filter(t => t.dueAt && t.dueAt <= todayEnd).length,
    Overdue: remindersOverdue.length,
    Upcoming: remindersUpcoming.length + tasksTodo.filter(t => !t.dueAt || t.dueAt > todayEnd).length,
    Done: remindersDone.length + tasksDone.length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reminders & Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {remindersOverdue.length > 0
              ? `${remindersOverdue.length} overdue — needs attention`
              : 'All caught up today'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Bell className="w-4 h-4 text-amber-500" />
            Add Reminder
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 shrink-0">
        {(['Today', 'Overdue', 'Upcoming', 'Done'] as ReminderTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t}
            {counts[t] > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-semibold',
                t === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              )}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'Overdue' && remindersOverdue.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-500">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            No overdue reminders!
          </div>
        )}

        {/* Reminders section */}
        {(tab === 'Today' && remindersToday.length > 0) || (tab === 'Overdue' && remindersOverdue.length > 0) || (tab === 'Upcoming' && remindersUpcoming.length > 0) ? (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Reminders
            </h2>
            <div className="space-y-2">
              {(tab === 'Today' ? remindersToday : tab === 'Overdue' ? remindersOverdue : remindersUpcoming).map((r) => (
                <div key={r.id} className={cn(
                  'bg-white rounded-xl border p-4 flex items-start gap-3',
                  tab === 'Overdue' ? 'border-red-200' : 'border-gray-200'
                )}>
                  {tab === 'Overdue'
                    ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    : <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{r.note}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{r.leadTitle}</span>
                      <span>·</span>
                      <span>{r.contactName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(r.dueAt)}
                      </span>
                      <span>·</span>
                      <span>{r.assignedTo}</span>
                    </div>
                  </div>
                  <button className="shrink-0 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Tasks section */}
        {(tab === 'Today' || tab === 'Upcoming' || tab === 'Done') && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5" /> Tasks
            </h2>
            <div className="space-y-2">
              {(tab === 'Done' ? tasksDone : tasksTodo).map((task) => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <CheckSquare className={cn('w-5 h-5 shrink-0 mt-0.5', task.status === 'done' ? 'text-green-500' : 'text-blue-500')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900')}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{task.leadTitle}</span>
                      <span>·</span>
                      <span>{task.assignedTo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </span>
                    {task.status !== 'done' && (
                      <button className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(tab === 'Done' ? tasksDone : tasksTodo).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nothing here</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
