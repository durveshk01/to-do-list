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
  Copy,
  Archive,
  Paperclip,
  Star,
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

export function TaskDetail({ task, open, onClose, onEdit, onDelete, onToggle, onDuplicate, onArchive, onFavorite, onUpdate, taskCollection = [] }) {
  if (!task) return null
  const { score, factors, priority, manual, autoPriority, blocked } = analyze(task, { tasks: taskCollection })
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
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => onFavorite?.(task)}><Star size={15} className={task.favorite ? 'fill-medium text-medium' : ''} />{task.favorite ? 'Favorited' : 'Favorite'}</button>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => onDuplicate?.(task)}><Copy size={15} />Duplicate</button>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => onArchive?.(task)}><Archive size={15} />{task.archived ? 'Restore' : 'Archive'}</button>
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
            {blocked && <span className="chip bg-medium/10 px-2.5 py-1 text-[0.72rem] text-medium">Blocked by prerequisite</span>}
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
            {task.completed ? `Completed ${humanStamp(task.completedAt).toLowerCase()}` : (task.status || 'todo').replace('-', ' ')}
          </Row>
          <Row icon={Clock} label="Estimated effort">{task.estimatedMinutes ? `${task.estimatedMinutes} minutes` : 'Not estimated'}</Row>
          <Row icon={Clock} label="Recurring">{task.recurring === 'custom' ? `Every ${task.recurrenceInterval || 1} days` : task.recurring && task.recurring !== 'none' ? task.recurring : 'Does not repeat'}</Row>
        </div>

        {task.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{task.tags.map((tag) => <span className="chip bg-accent-soft text-accent" key={tag}>#{tag}</span>)}</div>}

        {task.dependencies?.length > 0 && <section className="rounded-2xl border border-line bg-surface-2 p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-ink-3">Prerequisites</h4><ul className="mt-2 space-y-1">{task.dependencies.map((id) => { const dependency = taskCollection.find((item) => item.id === id); return <li key={id} className="flex items-center gap-2 text-sm text-ink-2"><span className={dependency?.completed ? 'text-done' : 'text-medium'}>{dependency?.completed ? '✓' : '○'}</span>{dependency?.title || 'Missing task'}</li> })}</ul></section>}

        {task.subtasks?.length > 0 && <SubtaskList task={task} onUpdate={onUpdate} onComplete={() => onToggle?.(task)} />}

        {task.notes && <section className="rounded-2xl border border-line bg-surface-2 p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-ink-3">Notes</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{task.notes}</p></section>}

        {task.attachments?.length > 0 && <section className="rounded-2xl border border-line bg-surface-2 p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-ink-3">Attachments</h4><ul className="mt-2 space-y-1.5">{task.attachments.map((file) => <li key={file.id}><a href={file.dataUrl} download={file.name} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-soft"><Paperclip size={14}/><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="shrink-0 text-xs text-ink-3">{Math.max(1, Math.round(file.size / 1024))} KB</span></a></li>)}</ul></section>}

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
                <span className={`text-[0.72rem] font-bold ${f.points < 0 ? 'text-high' : 'text-ink'}`}>{f.points > 0 ? '+' : ''}{f.points}</span>
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

        {task.activity?.length > 0 && <section><h4 className="text-xs font-bold uppercase tracking-wide text-ink-3">Activity</h4><ol className="mt-2 space-y-2">{[...task.activity].reverse().slice(0, 8).map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 text-xs text-ink-2"><span>{entry.text}</span><time className="shrink-0 text-ink-3">{humanStamp(entry.at)}</time></li>)}</ol></section>}

        <p className="text-[0.72rem] text-ink-3">
          Created {humanStamp(task.createdAt) || '—'}
          {task.updatedAt !== task.createdAt ? ` • Last updated ${humanStamp(task.updatedAt).toLowerCase()}` : ''}
        </p>
      </div>
    </Modal>
  )
}

function SubtaskList({ task, onUpdate, onComplete }) {
  const toggle = (items, id) => items.map((item) => item.id === id
    ? { ...item, completed: !item.completed }
    : { ...item, children: toggle(item.children || [], id) })
  const count = (items) => items.reduce((total, item) => total + 1 + count(item.children || []), 0)
  const done = (items) => items.reduce((total, item) => total + Number(item.completed) + done(item.children || []), 0)
  const total = count(task.subtasks)
  const completed = done(task.subtasks)
  const renderItems = (items, depth = 0) => items.map((item) => <li key={item.id} className="space-y-1"><label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-2 hover:bg-surface-3" style={{ marginLeft: depth * 16 }}><input type="checkbox" checked={item.completed} onChange={() => onUpdate?.(task.id, { subtasks: toggle(task.subtasks, item.id) })} /><span className={item.completed ? 'line-through opacity-60' : ''}>{item.title}</span></label>{item.children?.length > 0 && <ul>{renderItems(item.children, depth + 1)}</ul>}</li>)
  return <section className="rounded-2xl border border-line bg-surface-2 p-4"><div className="flex items-center justify-between"><h4 className="font-display text-sm font-bold text-ink">Subtasks</h4><span className="text-xs font-semibold text-ink-2">{completed} / {total} completed</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-done transition-all" style={{ width: `${total ? completed / total * 100 : 0}%` }} /></div><ul className="mt-2">{renderItems(task.subtasks)}</ul>{total > 0 && completed === total && !task.completed && <button type="button" className="btn btn-primary mt-3 w-full" onClick={onComplete}>All subtasks done — complete task</button>}</section>
}
