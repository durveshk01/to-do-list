import { toKey } from './date.js'

export const TASK_STATUSES = ['inbox', 'todo', 'in-progress', 'completed', 'archived']
export const TASK_PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent']
export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom interval' },
]

export function normalizeTask(task = {}) {
  const completed = Boolean(task.completed || task.status === 'completed')
  const createId = () => globalThis.crypto?.randomUUID?.() || `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return {
    ...task,
    id: String(task.id || createId()),
    title: String(task.title || '').trim().slice(0, 180),
    description: String(task.description || '').slice(0, 5000),
    category: String(task.category || 'Other').trim().slice(0, 60),
    dueDate: validDateKey(task.dueDate) ? task.dueDate : '',
    startDate: validDateKey(task.startDate) ? task.startDate : '',
    dueTime: validTime(task.dueTime) ? task.dueTime : '',
    priorityMode: ['auto', ...TASK_PRIORITIES.filter((value) => value !== 'none')].includes(task.priorityMode) ? task.priorityMode : 'auto',
    status: completed ? 'completed' : TASK_STATUSES.includes(task.status) ? task.status : 'todo',
    completed,
    completedAt: completed ? task.completedAt || new Date().toISOString() : null,
    reminder: Boolean(task.reminder),
    reminderOffset: task.reminderOffset || 'at',
    tags: normalizeTags(task.tags),
    subtasks: normalizeSubtasks(task.subtasks),
    notes: String(task.notes || '').slice(0, 10000),
    dependencies: Array.isArray(task.dependencies) ? [...new Set(task.dependencies.map(String))].slice(0, 100) : [],
    favorite: Boolean(task.favorite),
    archived: Boolean(task.archived || task.status === 'archived'),
    deleted: Boolean(task.deleted),
    recurring: ['daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom'].includes(task.recurring) ? task.recurring : 'none',
    recurrenceInterval: boundedNumber(task.recurrenceInterval, 1, 365) || 1,
    attachments: normalizeAttachments(task.attachments),
    estimatedMinutes: boundedNumber(task.estimatedMinutes, 0, 10080),
    actualMinutes: boundedNumber(task.actualMinutes, 0, 10080),
    order: Number.isFinite(Number(task.order)) ? Number(task.order) : 0,
    activity: normalizeActivity(task.activity),
    createdAt: validTimestamp(task.createdAt) ? task.createdAt : new Date().toISOString(),
    updatedAt: validTimestamp(task.updatedAt) ? task.updatedAt : new Date().toISOString(),
  }
}

export function validateTaskCollection(value) {
  if (!Array.isArray(value) || value.length > 10000) return { valid: false, error: 'The file must contain a task list with no more than 10,000 tasks.' }
  const ids = new Set()
  for (const item of value) {
    if (!item || typeof item !== 'object' || typeof item.title !== 'string' || item.title.trim().length < 1) {
      return { valid: false, error: 'Every task needs a title.' }
    }
    if (item.dueDate && !validDateKey(item.dueDate)) return { valid: false, error: `“${item.title}” has an invalid due date.` }
    if (item.id && ids.has(String(item.id))) return { valid: false, error: 'The file contains duplicate task IDs.' }
    if (item.id) ids.add(String(item.id))
  }
  return { valid: true, tasks: value.map(normalizeTask) }
}

export function nextRecurringTask(task, now = new Date()) {
  if (!task.recurring || task.recurring === 'none') return null
  const next = new Date(task.dueDate ? `${task.dueDate}T12:00:00` : now)
  if (task.recurring === 'daily') next.setDate(next.getDate() + 1)
  if (task.recurring === 'weekdays') {
    next.setDate(next.getDate() + 1)
    if (next.getDay() === 6) next.setDate(next.getDate() + 2)
    if (next.getDay() === 0) next.setDate(next.getDate() + 1)
  }
  if (task.recurring === 'weekly') next.setDate(next.getDate() + 7)
  if (task.recurring === 'monthly') next.setMonth(next.getMonth() + 1)
  if (task.recurring === 'yearly') next.setFullYear(next.getFullYear() + 1)
  if (task.recurring === 'custom') next.setDate(next.getDate() + (Number(task.recurrenceInterval) || 1))
  const dueDate = toKey(next)
  const timestamp = now.toISOString()
  const createId = () => globalThis.crypto?.randomUUID?.() || `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return normalizeTask({
    ...task,
    id: createId(),
    dueDate,
    completed: false,
    completedAt: null,
    status: 'todo',
    archived: false,
    deleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    seriesId: task.seriesId || task.id,
    generatedFrom: task.id,
    generationAt: task.completedAt || timestamp,
    activity: [{ id: createId(), type: 'created', at: timestamp, text: 'Next recurring occurrence created' }],
  })
}

export function addActivity(task, type, text, at = new Date().toISOString()) {
  const id = globalThis.crypto?.randomUUID?.() || `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return [...normalizeActivity(task.activity), { id, type, at, text }].slice(-100)
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return [...new Set(tags.map((tag) => String(tag).trim().replace(/^#/, '').slice(0, 32)).filter(Boolean))].slice(0, 20)
  if (typeof tags === 'string') return normalizeTags(tags.split(/[\s,]+/))
  return []
}

function normalizeSubtasks(items, depth = 0) {
  if (depth >= 8) return []
  if (!Array.isArray(items)) return []
  const createId = () => globalThis.crypto?.randomUUID?.() || `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return items.slice(0, 100).map((item) => typeof item === 'string'
    ? { id: createId(), title: item.slice(0, 180), completed: false, children: [] }
    : { id: String(item.id || createId()), title: String(item.title || '').slice(0, 180), completed: Boolean(item.completed), children: normalizeSubtasks(item.children, depth + 1) })
}

function normalizeActivity(items) {
  return Array.isArray(items) ? items.filter((item) => item && typeof item.text === 'string').slice(-100) : []
}

function normalizeAttachments(items) {
  if (!Array.isArray(items)) return []
  return items.slice(0, 5).filter((item) => item && typeof item.name === 'string' && typeof item.dataUrl === 'string' && item.dataUrl.length <= 700000 && /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i.test(item.dataUrl) && !/^(text\/html|image\/svg\+xml|application\/(javascript|x-javascript|xhtml\+xml))/i.test(item.type || '')).map((item) => ({
    id: String(item.id || `f-${Math.random().toString(36).slice(2)}`),
    name: item.name.slice(0, 180),
    type: String(item.type || 'application/octet-stream').slice(0, 100),
    size: boundedNumber(item.size, 0, 512000),
    dataUrl: item.dataUrl,
  }))
}

export function readAttachment(file) {
  if (!file || file.size > 512000) return Promise.reject(new Error('Each attachment must be 500 KB or smaller.'))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ id: globalThis.crypto?.randomUUID?.() || `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: String(reader.result || '') })
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

function boundedNumber(value, min, max) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : 0
}

function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && toKey(date) === value
}

function validTime(value) {
  return !value || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
}

function validTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}
