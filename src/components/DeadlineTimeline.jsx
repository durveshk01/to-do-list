import { AlertTriangle, CalendarClock, CalendarDays, CalendarRange, Sun } from 'lucide-react'
import { PriorityDot } from './PriorityBadge.jsx'
import { analyze } from '../lib/priority.js'
import { deadlineBucket, dueDateTime, formatDate, formatTime, shortDue } from '../lib/date.js'
import { useTaskUI } from '../store/TaskUI.jsx'
import { EmptyState } from './EmptyState.jsx'

const GROUPS = [
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, tone: 'text-high', ring: 'bg-high' },
  { key: 'today', label: 'Today', icon: Sun, tone: 'text-medium', ring: 'bg-medium' },
  { key: 'tomorrow', label: 'Tomorrow', icon: CalendarClock, tone: 'text-accent', ring: 'bg-accent' },
  { key: 'week', label: 'This week', icon: CalendarRange, tone: 'text-low', ring: 'bg-low' },
  { key: 'later', label: 'Later', icon: CalendarDays, tone: 'text-ink-3', ring: 'bg-line-strong' },
]

export function DeadlineTimeline({ tasks, limit }) {
  const { openDetail } = useTaskUI()
  const pending = tasks.filter((t) => !t.completed && t.dueDate)

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: pending
      .filter((t) => deadlineBucket(t) === g.key)
      .sort((a, b) => dueDateTime(a) - dueDateTime(b))
      .slice(0, limit),
  })).filter((g) => g.items.length)

  if (!grouped.length) {
    return (
      <EmptyState
        compact
        icon={CalendarDays}
        tone="done"
        title="No upcoming deadlines"
        message="Nothing is scheduled right now. Add a task with a deadline to see it on the timeline."
      />
    )
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => {
        const Icon = group.icon
        return (
          <div key={group.key}>
            <h3 className={`mb-2 flex items-center gap-2 text-[0.76rem] font-bold uppercase tracking-wide ${group.tone}`}>
              <Icon size={14} />
              {group.label}
              <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[0.66rem] text-ink-2">
                {group.items.length}
              </span>
            </h3>

            <ol className="relative space-y-1.5 border-l border-line pl-4">
              {group.items.map((task) => {
                const priority = analyze(task).priority
                return (
                  <li key={task.id} className="relative">
                    <span
                      className={`absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                        priority === 'high' ? 'bg-high' : priority === 'medium' ? 'bg-medium' : 'bg-low'
                      }`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => openDetail(task)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition hover:-translate-y-px hover:shadow-sm ${
                        group.key === 'overdue'
                          ? 'border-high/25 bg-high/[0.06]'
                          : group.key === 'today'
                            ? 'border-medium/25 bg-medium/[0.06]'
                            : 'border-line bg-surface-2 hover:border-line-strong'
                      }`}
                    >
                      <PriorityDot priority={priority} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.85rem] font-semibold text-ink">{task.title}</span>
                        <span className="block truncate text-[0.72rem] text-ink-3">{task.category}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={`block text-[0.76rem] font-bold ${
                            group.key === 'overdue' ? 'text-high' : group.key === 'today' ? 'text-medium' : 'text-ink-2'
                          }`}
                        >
                          {shortDue(task)}
                        </span>
                        <span className="block text-[0.68rem] text-ink-3">
                          {task.dueTime ? formatTime(task.dueTime) : formatDate(task.dueDate)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </div>
  )
}
