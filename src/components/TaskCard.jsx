import { useEffect, useRef, useState } from 'react'
import { BellRing, CalendarClock, Check, Eye, MoreVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { PriorityBadge } from './PriorityBadge.jsx'
import { analyze } from '../lib/priority.js'
import { formatTime, isOverdue, shortDue } from '../lib/date.js'
import { useTaskUI } from '../store/TaskUI.jsx'

function QuickMenu({ task }) {
  const { openDetail, openEdit, askDelete, toggle } = useTaskUI()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = [
    { label: 'View details', icon: Eye, run: () => openDetail(task) },
    { label: 'Edit task', icon: Pencil, run: () => openEdit(task) },
    {
      label: task.completed ? 'Reopen task' : 'Mark complete',
      icon: task.completed ? RotateCcw : Check,
      run: () => toggle(task),
    },
    { label: 'Delete task', icon: Trash2, run: () => askDelete(task), danger: true },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Actions for ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="rounded-lg p-1.5 text-ink-3 transition hover:bg-surface-3 hover:text-ink"
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="card absolute right-0 top-9 z-30 w-44 animate-pop overflow-hidden p-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map(({ label, icon: Icon, run, danger }) => (
            <button
              key={label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                run()
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.82rem] font-medium transition ${
                danger ? 'text-high hover:bg-high/10' : 'text-ink-2 hover:bg-surface-3 hover:text-ink'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TaskCheckbox({ task, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.completed}
      aria-label={task.completed ? `Reopen ${task.title}` : `Mark ${task.title} as complete`}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(task)
      }}
      className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-2 transition-all duration-200 ${
        task.completed
          ? 'scale-100 border-done bg-done text-white'
          : 'border-line-strong text-transparent hover:border-accent hover:bg-accent/10'
      }`}
    >
      <Check size={13} strokeWidth={3.4} className={task.completed ? 'animate-pop' : ''} />
    </button>
  )
}

/**
 * The task row used across the dashboard, task list, completed page and search.
 */
export function TaskCard({ task, compact = false, showScore = false }) {
  const { openDetail, toggle } = useTaskUI()
  const { priority, score } = analyze(task)
  const overdue = isOverdue(task)
  const due = shortDue(task)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => openDetail(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail(task)
        }
      }}
      className={`card card-hover group relative flex cursor-pointer gap-3 overflow-hidden ${
        compact ? 'p-3.5' : 'p-4'
      } ${task.completed ? 'opacity-[0.78]' : ''}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-1 transition-all group-hover:w-1.5"
        style={{
          background: task.completed
            ? 'var(--color-done)'
            : priority === 'high'
              ? 'var(--color-high)'
              : priority === 'medium'
                ? 'var(--color-medium)'
                : 'var(--color-low)',
        }}
        aria-hidden="true"
      />

      <div className="pl-1.5">
        <TaskCheckbox task={task} onToggle={toggle} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`min-w-0 truncate font-display text-[0.95rem] font-bold leading-snug text-ink ${
              task.completed ? 'line-through decoration-done/60 decoration-2' : ''
            }`}
          >
            {task.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {showScore && !task.completed && (
              <span className="hidden rounded-md bg-surface-3 px-1.5 py-0.5 text-[0.68rem] font-bold text-ink-2 sm:inline">
                {score}
              </span>
            )}
            <PriorityBadge priority={task.completed ? 'completed' : priority} />
            <QuickMenu task={task} />
          </div>
        </div>

        {!compact && task.description && (
          <p className="mt-1 line-clamp-1 text-[0.8rem] text-ink-2">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.74rem] text-ink-3">
          <span className="chip bg-surface-3 text-ink-2">{task.category}</span>
          <span className="hidden text-line-strong sm:inline" aria-hidden="true">
            •
          </span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              task.completed ? 'text-ink-3' : overdue ? 'text-high' : due === 'Today' ? 'text-medium' : 'text-ink-2'
            }`}
          >
            <CalendarClock size={12} aria-hidden="true" />
            {task.dueDate ? `Due ${due}` : 'No deadline'}
            {task.dueTime && !task.completed ? ` • ${formatTime(task.dueTime)}` : ''}
          </span>
          {task.reminder && !task.completed && (
            <span className="inline-flex items-center gap-1 text-accent" title="Reminder is on">
              <BellRing size={12} aria-hidden="true" />
              Reminder
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
