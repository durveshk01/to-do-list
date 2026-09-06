import {
  BellOff,
  BellRing,
  CalendarClock,
  Check,
  CircleCheck,
  Clock,
  FolderOpen,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Modal } from './Modal.jsx'
import { PriorityBadge } from './PriorityBadge.jsx'
import { REMINDER_OFFSETS, analyze } from '../lib/priority.js'
import { formatDateTime, humanStamp, isOverdue, relativeDue } from '../lib/date.js'

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface-2 p-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-ink-2">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
        <p className="mt-0.5 break-words text-[0.86rem] font-semibold text-ink">{children}</p>
      </div>
    </div>
  )
}

export function TaskDetail({ task, open, onClose, onEdit, onDelete, onToggle }) {
  if (!task) return null
  const { score, factors, priority, manual, autoPriority } = analyze(task)
  const overdue = isOverdue(task)
  const reminderLabel = REMINDER_OFFSETS.find((r) => r.value === task.reminderOffset)?.label || 'At deadline'

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Task details"
      description={task.completed ? 'Completed task' : relativeDue(task)}
      icon={
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <CircleCheck size={19} />
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => onDelete?.(task)}>
            <Trash2 size={16} />
            Delete
          </button>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => onEdit?.(task)}>
            <Pencil size={16} />
            Edit task
          </button>
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => onToggle?.(task)}>
            {task.completed ? <RotateCcw size={16} /> : <Check size={16} />}
            {task.completed ? 'Reopen task' : 'Mark complete'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {task.completed ? <PriorityBadge priority="completed" full size="md" /> : <PriorityBadge priority={priority} full size="md" />}
            {overdue && (
              <span className="chip bg-high/12 px-2.5 py-1 text-[0.72rem] text-high ring-1 ring-inset ring-high/25">
                Overdue
              </span>
            )}
            {manual && !task.completed && (
              <span className="chip bg-surface-3 px-2.5 py-1 text-[0.72rem] text-ink-2">Manual priority</span>
            )}
          </div>
          <h3
            className={`font-display text-xl font-extrabold leading-snug text-ink ${
              task.completed ? 'line-through decoration-done/60 decoration-2' : ''
            }`}
          >
            {task.title}
          </h3>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-2">
            {task.description || 'No description was added for this task.'}
          </p>
        </div>

        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
          <Row icon={FolderOpen} label="Category">
            {task.category}
          </Row>
          <Row icon={CalendarClock} label="Deadline">
            {formatDateTime(task)}
          </Row>
          <Row icon={task.reminder ? BellRing : BellOff} label="Reminder">
            {task.reminder ? `ON • ${reminderLabel}` : 'OFF'}
          </Row>
          <Row icon={Clock} label="Status">
            {task.completed ? `Completed ${humanStamp(task.completedAt).toLowerCase()}` : 'Pending'}
          </Row>
        </div>

        {/* Smart priority explanation */}
        <section className="overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-transparent p-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 font-display text-[0.92rem] font-bold text-ink">
              <Sparkles size={16} className="text-accent" />
              Smart Priority explanation
            </h4>
            <span className="rounded-lg bg-surface/80 px-2 py-1 text-[0.72rem] font-bold text-ink">{score}/100</span>
          </header>

          <p className="mt-2 text-[0.8rem] text-ink-2">
            {manual
              ? `You set this manually to ${priority} priority. Auto detection would have ranked it ${autoPriority}.`
              : `Why this task is ${priority} priority:`}
          </p>

          <ul className="mt-3 space-y-1.5">
            {factors.map((f, i) => (
              <li
                key={`${f.label}-${i}`}
                className="flex items-center gap-2 rounded-lg bg-surface/70 px-2.5 py-1.5 text-[0.78rem]"
              >
                <Check size={13} className={f.points > 0 ? 'text-done' : 'text-ink-3'} aria-hidden="true" />
                <span className="flex-1 text-ink-2">{f.label}</span>
                <span className="text-[0.72rem] font-bold text-ink">+{f.points}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${score}%`,
                background:
                  priority === 'high'
                    ? 'linear-gradient(90deg,#f97316,#ef4444)'
                    : priority === 'medium'
                      ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                      : 'linear-gradient(90deg,#60a5fa,#3b82f6)',
              }}
            />
          </div>
        </section>

        <p className="text-[0.72rem] text-ink-3">
          Created {humanStamp(task.createdAt) || '—'}
          {task.updatedAt !== task.createdAt ? ` • Last updated ${humanStamp(task.updatedAt).toLowerCase()}` : ''}
        </p>
      </div>
    </Modal>
  )
}
