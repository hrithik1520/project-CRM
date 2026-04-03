'use client'

import { useState } from 'react'
import { Bell, CheckSquare, Clock, CheckCircle2, Plus, AlertCircle } from 'lucide-react'
import { useReminders, useTasks, useMarkReminderDone, useUpdateTaskStatus } from '@/lib/hooks/use-reminders'
import { cn } from '@/lib/utils'

type ReminderTab = 'Today' | 'Upcoming' | 'Overdue' | 'Done'

export default function RemindersPage() {
  const [tab, setTab] = useState<ReminderTab>('Today')

  const { data: todayReminders = [], isLoading: l1 } = useReminders('today')
  const { data: upcomingReminders = [], isLoading: l2 } = useReminders('upcoming')
  const { data: overdueReminders = [], isLoading: l3 } = useReminders('overdue')
  const { data: doneReminders = [], isLoading: l4 } = useReminders('done')

  const { data: pendingTasks = [], isLoading: l5 } = useTasks()
  const { data: doneTasks = [], isLoading: l6 } = useTasks('done')

  const markDone = useMarkReminderDone()
  const updateTask = useUpdateTaskStatus()

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6

  const counts: Record<ReminderTab, number> = {
    Today: todayReminders.length + pendingTasks.length,
    Overdue: overdueReminders.length,
    Upcoming: upcomingReminders.length,
    Done: doneReminders.length + doneTasks.length,
  }

  const activeReminders = tab === 'Today' ? todayReminders : tab === 'Overdue' ? overdueReminders : tab === 'Upcoming' ? upcomingReminders : doneReminders
  const activeTasks = tab === 'Done' ? doneTasks : tab !== 'Overdue' ? pendingTasks : []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reminders & Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {overdueReminders.length > 0 ? `${overdueReminders.length} overdue — needs attention` : 'All caught up today'}
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
              <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-semibold', t === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p className="text-sm text-gray-400 text-center py-12">Loading…</p>}

        {!isLoading && tab === 'Overdue' && overdueReminders.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-500">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            No overdue reminders!
          </div>
        )}

        {/* Reminders section */}
        {!isLoading && activeReminders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Reminders
            </h2>
            <div className="space-y-2">
              {activeReminders.map((r) => (
                <div
                  key={r.id}
                  className={cn('bg-white rounded-xl border p-4 flex items-start gap-3', tab === 'Overdue' ? 'border-red-200' : 'border-gray-200')}
                >
                  {tab === 'Overdue'
                    ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    : <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{r.lead?.title}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.dueAt))}
                      </span>
                      <span>·</span>
                      <span>{r.assignedTo.name}</span>
                    </div>
                  </div>
                  {!r.isDone && (
                    <button
                      onClick={() => markDone.mutate(r.id)}
                      className="shrink-0 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks section */}
        {!isLoading && activeTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5" /> Tasks
            </h2>
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <CheckSquare className={cn('w-5 h-5 shrink-0 mt-0.5', task.status === 'done' ? 'text-green-500' : 'text-blue-500')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900')}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{task.lead?.title}</span>
                      <span>·</span>
                      <span>{task.assignedTo.name}</span>
                      {task.dueAt && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(task.dueAt))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {task.status !== 'done' && (
                    <button
                      onClick={() => updateTask.mutate({ id: task.id, status: 'done' })}
                      className="shrink-0 px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && activeReminders.length === 0 && activeTasks.length === 0 && tab !== 'Overdue' && (
          <p className="text-sm text-gray-400 text-center py-12">Nothing here</p>
        )}
      </div>
    </div>
  )
}
