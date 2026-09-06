import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, BellRing, Check, PlusCircle, Sparkles, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { Meter } from '../components/charts/Charts.jsx'
import { CATEGORIES, CATEGORY_WEIGHT, PRIORITY_MODES, REMINDER_OFFSETS, analyze } from '../lib/priority.js'
import { relativeDue, toKey } from '../lib/date.js'
import { useApp } from '../store/AppStore.jsx'

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

function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high">
      <AlertCircle size={13} aria-hidden="true" />
      {children}
    </p>
  )
}

/** Full-page version of the create-task flow (the modal is used elsewhere). */
export function AddTask() {
  const { addTask, toast, settings } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: settings.defaultCategory,
    dueDate: toKey(),
    dueTime: '23:59',
    priorityMode: 'auto',
    reminder: settings.defaultReminder,
    reminderOffset: settings.defaultReminderOffset,
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const preview = useMemo(() => analyze({ ...form, completed: false }), [form])

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
    addTask({ ...form, title: form.title.trim(), description: form.description.trim() })
    toast('Task created successfully!', {
      description: `Smart Priority ranked it as ${preview.priority.toUpperCase()} (${preview.score}/100).`,
    })
    navigate('/tasks')
  }

  return (
    <div>
      <PageHeader
        icon={PlusCircle}
        eyebrow="Create"
        title="Add New Task"
        subtitle="Describe it once — Smart Priority works out how urgent it is."
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <form onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-6">
          <div>
            <Label htmlFor="at-title" required>
              Task title
            </Label>
            <input
              id="at-title"
              className={`field ${errors.title ? 'field-error' : ''}`}
              placeholder="e.g. Complete AI Project Report"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              onBlur={() => setTouched(true)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'at-title-error' : undefined}
            />
            <FieldError id="at-title-error">{errors.title}</FieldError>
          </div>

          <div>
            <Label htmlFor="at-desc" hint="Optional">
              Description
            </Label>
            <textarea
              id="at-desc"
              rows={4}
              className="field resize-y"
              placeholder="Add any details, submission link or notes you'll need later…"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <Label htmlFor="at-category" hint={`+${CATEGORY_WEIGHT[form.category] ?? 5} points`}>
                Category
              </Label>
              <select
                id="at-category"
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
              <Label htmlFor="at-priority" hint={form.priorityMode === 'auto' ? 'Recommended' : 'Manual override'}>
                Priority
              </Label>
              <select
                id="at-priority"
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
              <Label htmlFor="at-date" hint={form.dueDate ? relativeDue(form) : undefined}>
                Deadline
              </Label>
              <input
                id="at-date"
                type="date"
                className={`field ${errors.dueDate ? 'field-error' : ''}`}
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? 'at-date-error' : undefined}
              />
              <FieldError id="at-date-error">{errors.dueDate}</FieldError>
            </div>

            <div>
              <Label htmlFor="at-time">Time</Label>
              <input
                id="at-time"
                type="time"
                className="field"
                value={form.dueTime}
                onChange={(e) => set({ dueTime: e.target.value })}
              />
            </div>
          </div>

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
                <Label htmlFor="at-remind">Remind me</Label>
                <select
                  id="at-remind"
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

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              <X size={16} />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              Create Task
            </button>
          </div>
        </form>

        {/* Live scoring panel */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-xl2 border border-indigo-500/25 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-5 text-white">
            <p className="flex items-center gap-2 text-[0.74rem] font-bold uppercase tracking-[0.12em] text-white/85">
              <Sparkles size={15} />
              Smart Priority preview
            </p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="font-display text-4xl font-extrabold leading-none">{preview.score}</p>
                <p className="mt-1 text-[0.72rem] text-white/70">urgency score / 100</p>
              </div>
              <span
                className={`chip px-2.5 py-1 text-[0.74rem] font-bold ${
                  preview.priority === 'high'
                    ? 'bg-white text-red-600'
                    : preview.priority === 'medium'
                      ? 'bg-white text-amber-600'
                      : 'bg-white text-blue-600'
                }`}
              >
                {preview.priority === 'high' ? '🔴' : preview.priority === 'medium' ? '🟠' : '🔵'}{' '}
                {preview.priority.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${preview.score}%` }}
              />
            </div>
            {preview.manual && (
              <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[0.74rem] text-white/85">
                Manual override active — auto detection suggested <strong>{preview.autoPriority}</strong>.
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-display text-[0.95rem] font-bold text-ink">How this score is built</h3>
            <ul className="mt-3 space-y-2">
              {preview.factors.map((f, i) => (
                <li key={`${f.label}-${i}`}>
                  <div className="flex items-center justify-between gap-2 text-[0.8rem]">
                    <span className="text-ink-2">{f.label}</span>
                    <span className="shrink-0 font-bold text-ink">+{f.points}</span>
                  </div>
                  <Meter value={f.points} max={55} color="var(--color-accent)" className="mt-1" />
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[0.74rem] text-ink-2">
              <p className="flex items-center justify-between">
                <span>Score 70 or above</span>
                <PriorityBadge priority="high" />
              </p>
              <p className="flex items-center justify-between">
                <span>Score 40 – 69</span>
                <PriorityBadge priority="medium" />
              </p>
              <p className="flex items-center justify-between">
                <span>Below 40</span>
                <PriorityBadge priority="low" />
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
