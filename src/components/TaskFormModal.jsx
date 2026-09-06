import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BellRing, CalendarClock, Check, Sparkles } from 'lucide-react'
import { Modal } from './Modal.jsx'
import { PriorityBadge } from './PriorityBadge.jsx'
import { CATEGORIES, PRIORITY_MODES, REMINDER_OFFSETS, analyze } from '../lib/priority.js'
import { toKey } from '../lib/date.js'
import { useApp } from '../store/AppStore.jsx'

const blank = (settings) => ({
  title: '',
  description: '',
  category: settings?.defaultCategory || 'Academic',
  dueDate: toKey(),
  dueTime: '23:59',
  priorityMode: 'auto',
  reminder: settings?.defaultReminder ?? true,
  reminderOffset: settings?.defaultReminderOffset || '1h',
})

function Label({ htmlFor, children, required, hint }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[0.8rem] font-semibold text-ink">
        {children}
        {required && (
          <span className="ml-0.5 text-high" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <span className="text-[0.7rem] text-ink-3">{hint}</span>}
    </div>
  )
}

function FieldError({ children, id }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high">
      <AlertCircle size={13} aria-hidden="true" />
      {children}
    </p>
  )
}

export function TaskFormModal({ open, mode = 'add', task, onClose }) {
  const { addTask, updateTask, toast, settings } = useApp()
  const [form, setForm] = useState(() => blank(settings))
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setTouched(false)
    setForm(mode === 'edit' && task ? { ...task } : blank(settings))
  }, [open, mode, task, settings])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const preview = useMemo(
    () => analyze({ ...form, completed: false, category: form.category || 'Other' }),
    [form],
  )

  const validate = (data) => {
    const next = {}
    if (!data.title.trim()) next.title = 'Please enter a task title.'
    else if (data.title.trim().length < 3) next.title = 'Give the task a slightly longer name (3+ characters).'
    if (data.dueDate) {
      const d = new Date(`${data.dueDate}T00:00:00`)
      if (Number.isNaN(d.getTime())) next.dueDate = 'Please choose a valid deadline date.'
      else if (d.getFullYear() < 2000 || d.getFullYear() > 2100)
        next.dueDate = 'Deadline must be between the year 2000 and 2100.'
    }
    if (!data.dueDate && data.dueTime) next.dueDate = 'Pick a deadline date to go with that time.'
    if (!data.dueDate && data.reminder) next.dueDate = 'A reminder needs a deadline. Choose a date first.'
    return next
  }

  useEffect(() => {
    if (touched) setErrors(validate(form))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, touched])

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    const next = validate(form)
    setErrors(next)
    if (Object.keys(next).length) {
      toast('Please fix the highlighted fields', { tone: 'error', description: Object.values(next)[0] })
      return
    }
    const payload = { ...form, title: form.title.trim(), description: form.description.trim() }
    if (mode === 'edit' && task) {
      updateTask(task.id, payload)
      toast('Task updated successfully!', {
        description: `“${payload.title}” is now ${analyze({ ...payload, completed: false }).priority} priority.`,
      })
    } else {
      addTask(payload)
      toast('Task created successfully!', {
        description: `Smart Priority ranked it as ${preview.priority.toUpperCase()} (${preview.score}/100).`,
      })
    }
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={mode === 'edit' ? 'Edit task' : 'Add new task'}
      description={
        mode === 'edit'
          ? 'Update the details — Smart Priority recalculates instantly.'
          : 'Describe it once. Smart Priority works out how urgent it is.'
      }
      icon={
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Sparkles size={19} />
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="task-form" className="btn btn-primary w-full sm:w-auto">
            <Check size={16} />
            {mode === 'edit' ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="space-y-5">
        <div>
          <Label htmlFor="title" required>
            Task title
          </Label>
          <input
            id="title"
            data-autofocus
            className={`field ${errors.title ? 'field-error' : ''}`}
            placeholder="e.g. Complete AI Project Report"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          <FieldError id="title-error">{errors.title}</FieldError>
        </div>

        <div>
          <Label htmlFor="description" hint="Optional">
            Description
          </Label>
          <textarea
            id="description"
            rows={3}
            className="field resize-y"
            placeholder="Add any details, submission link or notes you'll need later…"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="field"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="priorityMode" hint={form.priorityMode === 'auto' ? 'Recommended' : 'Manual override'}>
              Priority
            </Label>
            <select
              id="priorityMode"
              className="field"
              value={form.priorityMode}
              onChange={(e) => set({ priorityMode: e.target.value })}
            >
              {PRIORITY_MODES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="dueDate">Deadline</Label>
            <input
              id="dueDate"
              type="date"
              className={`field ${errors.dueDate ? 'field-error' : ''}`}
              value={form.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'due-error' : undefined}
            />
            <FieldError id="due-error">{errors.dueDate}</FieldError>
          </div>

          <div>
            <Label htmlFor="dueTime">Time</Label>
            <input
              id="dueTime"
              type="time"
              className="field"
              value={form.dueTime}
              onChange={(e) => set({ dueTime: e.target.value })}
            />
          </div>
        </div>

        {/* Reminder */}
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
                <BellRing size={17} />
              </span>
              <div>
                <p className="text-[0.85rem] font-semibold text-ink">Reminder</p>
                <p className="text-[0.74rem] text-ink-2">Get an alert before this deadline arrives.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.reminder}
              aria-label="Toggle reminder"
              onClick={() => set({ reminder: !form.reminder })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.reminder ? 'bg-accent' : 'bg-line-strong'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.reminder ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {form.reminder && (
            <div className="mt-3.5 animate-fade">
              <Label htmlFor="reminderOffset">Remind me</Label>
              <select
                id="reminderOffset"
                className="field"
                value={form.reminderOffset}
                onChange={(e) => set({ reminderOffset: e.target.value })}
              >
                {REMINDER_OFFSETS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live smart-priority preview */}
        <div className="overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-transparent p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[0.8rem] font-bold text-ink">
              <Sparkles size={15} className="text-accent" />
              Smart Priority preview
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[0.72rem] font-semibold text-ink-2">{preview.score}/100</span>
              <PriorityBadge priority={preview.priority} full />
            </div>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${preview.score}%`,
                background:
                  preview.priority === 'high'
                    ? 'linear-gradient(90deg,#f97316,#ef4444)'
                    : preview.priority === 'medium'
                      ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                      : 'linear-gradient(90deg,#60a5fa,#3b82f6)',
              }}
            />
          </div>
          <ul className="mt-3 space-y-1">
            {preview.factors
              .filter((f) => f.points > 0)
              .map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-[0.76rem] text-ink-2">
                  <CalendarClock size={12} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="flex-1">{f.label}</span>
                  <span className="font-semibold text-ink">+{f.points}</span>
                </li>
              ))}
          </ul>
          {preview.manual && (
            <p className="mt-2.5 rounded-lg bg-surface/70 px-2.5 py-1.5 text-[0.72rem] text-ink-2">
              Manual override active — auto detection suggested{' '}
              <strong className="text-ink">{preview.autoPriority}</strong>.
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
