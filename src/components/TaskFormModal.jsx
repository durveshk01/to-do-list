import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BellRing, CalendarClock, Check, Paperclip, Sparkles, X } from 'lucide-react'
import { Modal } from './Modal.jsx'
import { PriorityBadge } from './PriorityBadge.jsx'
import { CATEGORIES, PRIORITY_MODES, REMINDER_OFFSETS, analyze } from '../lib/priority.js'
import { toKey } from '../lib/date.js'
import { useApp } from '../store/AppStore.jsx'
import { readAttachment, RECURRENCE_OPTIONS } from '../lib/taskModel.js'

const blank = (settings) => ({
  title: '',
  description: '',
  category: settings?.defaultCategory || 'Academic',
  dueDate: toKey(),
  dueTime: '23:59',
  priorityMode: settings?.defaultPriority || 'auto',
  reminder: settings?.defaultReminder ?? true,
  reminderOffset: settings?.defaultReminderOffset || '1h',
  status: 'todo',
  tags: [],
  startDate: '',
  estimatedMinutes: Number(settings?.defaultDuration) || 30,
  recurring: 'none',
  recurrenceInterval: 1,
  attachments: [],
  subtasks: [],
  notes: '',
  favorite: false,
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
  const { addTask, updateTask, toast, settings, tasks } = useApp()
  const categories = [...new Set([...CATEGORIES, ...(settings.customCategories || [])])]
  const [form, setForm] = useState(() => blank(settings))
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [attachmentBusy, setAttachmentBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setTouched(false)
    setForm(mode === 'edit' && task ? { ...task } : blank(settings))
    setTagInput('')
    setSubtaskInput('')
    setAttachmentBusy(false)
  }, [open, mode, task, settings])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const addAttachments = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setAttachmentBusy(true)
    try {
      const added = await Promise.all(files.map(readAttachment))
      setForm((current) => ({ ...current, attachments: [...(current.attachments || []), ...added].slice(0, 5) }))
      toast('Attachments added', { tone: 'success', description: 'Files are stored with this task in your browser.' })
    } catch (error) {
      toast('Attachment could not be added', { tone: 'error', description: error.message })
    } finally {
      setAttachmentBusy(false)
    }
  }

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
              {categories.map((c) => (
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
          <div>
            <Label htmlFor="taskStatus">Status</Label>
            <select id="taskStatus" className="field" value={form.status || 'todo'} onChange={(e) => set({ status: e.target.value })}>
              <option value="inbox">Inbox</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
            </select>
          </div>
          <div>
            <Label htmlFor="estimatedMinutes">Estimated effort</Label>
            <div className="relative">
              <input id="estimatedMinutes" type="number" min="0" max="10080" step="5" className="field pr-20" value={form.estimatedMinutes || 0} onChange={(e) => set({ estimatedMinutes: Math.max(0, Number(e.target.value) || 0) })} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">minutes</span>
            </div>
          </div>
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <input id="startDate" type="date" className="field" value={form.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="recurring">Repeat</Label>
            <select id="recurring" className="field" value={form.recurring || 'none'} onChange={(e) => set({ recurring: e.target.value })}>
              {RECURRENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {form.recurring === 'custom' && <div><Label htmlFor="recurrenceInterval">Repeat every</Label><div className="relative"><input id="recurrenceInterval" type="number" min="1" max="365" className="field pr-16" value={form.recurrenceInterval || 1} onChange={(event) => set({ recurrenceInterval: Math.max(1, Math.min(365, Number(event.target.value) || 1)) })}/><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">days</span></div></div>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="taskTags">Tags</Label>
            <input id="taskTags" className="field" placeholder="assignment, coding, urgent" value={tagInput || (form.tags || []).join(', ')} onChange={(e) => { setTagInput(e.target.value); set({ tags: e.target.value.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean) }) }} />
            <p className="mt-1 text-xs text-ink-3">Separate tags with commas.</p>
          </div>
          <div>
            <Label htmlFor="taskSubtasks">Subtasks</Label>
            <textarea id="taskSubtasks" rows={3} className="field resize-y" placeholder={'Read the brief\nDraft the outline'} value={subtaskInput || (form.subtasks || []).map((item) => item.title).join('\n')} onChange={(e) => { setSubtaskInput(e.target.value); set({ subtasks: e.target.value.split('\n').map((title) => title.trim()).filter(Boolean).map((title) => ({ title, completed: false, children: [] })) }) }} />
            <p className="mt-1 text-xs text-ink-3">One subtask per line. You can track them from task details.</p>
          </div>
        </div>

        <div>
          <Label htmlFor="taskNotes" hint="Private to you">Notes</Label>
          <textarea id="taskNotes" rows={2} className="field resize-y" value={form.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Links, context or anything to remember…" />
        </div>

        <div>
          <Label htmlFor="taskDependencies">Blocked by</Label>
          <select id="taskDependencies" multiple className="field min-h-24" value={form.dependencies || []} onChange={(event) => set({ dependencies: Array.from(event.target.selectedOptions, (option) => option.value) })} aria-describedby="dependency-hint">
            {tasks.filter((item) => item.id !== task?.id && !item.deleted && !item.archived).map((item) => <option key={item.id} value={item.id}>{item.completed ? '✓ ' : ''}{item.title}</option>)}
          </select>
          <p id="dependency-hint" className="mt-1 text-xs text-ink-3">Hold Ctrl or ⌘ to choose multiple prerequisites. A task stays blocked until they’re complete.</p>
        </div>

        <div>
          <Label htmlFor="taskAttachments" hint="Up to 5 files, 500 KB each">Attachments</Label>
          <input id="taskAttachments" type="file" multiple className="field file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent" onChange={addAttachments} disabled={attachmentBusy || (form.attachments || []).length >= 5}/>
          <ul className="mt-2 space-y-1">{(form.attachments || []).map((file) => <li key={file.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs"><Paperclip size={13} className="text-accent"/><span className="min-w-0 flex-1 truncate text-ink-2">{file.name}</span><button type="button" onClick={() => set({ attachments: form.attachments.filter((item) => item.id !== file.id) })} aria-label={`Remove ${file.name}`} className="rounded p-1 text-ink-3 hover:text-high"><X size={14}/></button></li>)}</ul>
          <p className="mt-1 text-xs text-ink-3">Attached files stay on this device with the task.</p>
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
