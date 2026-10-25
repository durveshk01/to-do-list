
import { daysUntil, isOverdue } from './date.js'

export const CATEGORIES = ['Academic', 'Personal', 'Project', 'Exam Preparation', 'Other']

export const CATEGORY_WEIGHT = {
  Academic: 20,
  Personal: 5,
  Project: 15,
  'Exam Preparation': 25,
  Other: 5,
}

export const PRIORITY_MODES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'none', label: 'No priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'urgent', label: 'Urgent' },
]

export const REMINDER_OFFSETS = [
  { value: 'at', label: 'At deadline', minutes: 0 },
  { value: '15m', label: '15 minutes before', minutes: 15 },
  { value: '30m', label: '30 minutes before', minutes: 30 },
  { value: '1h', label: '1 hour before', minutes: 60 },
  { value: '1d', label: '1 day before', minutes: 1440 },
]

export const PRIORITY_META = {
  high: {
    key: 'high',
    label: 'High Priority',
    short: 'High',
    dot: '🔴',
    color: 'var(--color-high)',
    text: 'text-high',
    bg: 'bg-high/10',
    border: 'border-high/30',
    solid: 'bg-high',
  },
  medium: {
    key: 'medium',
    label: 'Medium Priority',
    short: 'Medium',
    dot: '🟠',
    color: 'var(--color-medium)',
    text: 'text-medium',
    bg: 'bg-medium/10',
    border: 'border-medium/30',
    solid: 'bg-medium',
  },
  low: {
    key: 'low',
    label: 'Low Priority',
    short: 'Low',
    dot: '🔵',
    color: 'var(--color-low)',
    text: 'text-low',
    bg: 'bg-low/10',
    border: 'border-low/30',
    solid: 'bg-low',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    short: 'Done',
    dot: '🟢',
    color: 'var(--color-done)',
    text: 'text-done',
    bg: 'bg-done/10',
    border: 'border-done/30',
    solid: 'bg-done',
  },
  urgent: { key: 'urgent', label: 'Urgent', short: 'Urgent', dot: '🚨', color: 'var(--color-high)', text: 'text-high', bg: 'bg-high/15', border: 'border-high/40', solid: 'bg-high' },
  none: { key: 'none', label: 'No priority', short: 'None', dot: '⚪', color: 'var(--color-ink-3)', text: 'text-ink-3', bg: 'bg-surface-3', border: 'border-line', solid: 'bg-ink-3' },
}


export function urgencyPoints(task) {
  const days = daysUntil(task)
  if (days === null) return { points: 0, label: 'No deadline set' }
  if (isOverdue(task)) return { points: 55, label: 'Deadline has already passed' }
  if (days === 0) return { points: 50, label: 'Deadline is today' }
  if (days === 1) return { points: 40, label: 'Deadline is tomorrow' }
  if (days <= 3) return { points: 30, label: `Deadline is within 3 days` }
  if (days <= 7) return { points: 20, label: 'Deadline is within a week' }
  return { points: 10, label: 'Deadline is more than a week away' }
}


export function categoryPoints(task) {
  const points = CATEGORY_WEIGHT[task.category] ?? 5
  return { points, label: `${task.category} category weight` }
}


export function statusPoints(task) {
  const out = []
  if (!task.completed) out.push({ points: 10, label: 'Task is still pending' })
  else out.push({ points: 0, label: 'Task is already completed' })
  if (task.reminder && !task.completed) out.push({ points: 5, label: 'A reminder is active' })
  return out
}

export function effortPoints(task) {
  if (!task.estimatedMinutes) return { points: 0, label: 'No effort estimate' }
  if (task.estimatedMinutes <= 30) return { points: 10, label: 'Small task is quick to complete' }
  if (task.estimatedMinutes <= 60) return { points: 6, label: 'Estimated effort is about an hour' }
  return { points: 2, label: 'Long task benefits from an early start' }
}

export function agePoints(task, now = new Date()) {
  const age = Math.max(0, Math.floor((now - new Date(task.createdAt || now)) / 86_400_000))
  const points = task.completed ? 0 : Math.min(10, age)
  return { points, label: points ? `Waiting for ${age} day${age === 1 ? '' : 's'}` : 'Recently added' }
}

export function isBlocked(task, tasks = []) {
  const dependencies = Array.isArray(task.dependencies) ? task.dependencies : []
  return dependencies.some((id) => tasks.some((candidate) => candidate.id === id && !candidate.completed))
}

export const MAX_SCORE = 100


export function analyze(task, context = {}) {
  const urgency = urgencyPoints(task)
  const category = categoryPoints(task)
  const status = statusPoints(task)
  const effort = effortPoints(task)
  const age = agePoints(task)
  const blocked = isBlocked(task, context.tasks || [])

  const factors = [
    { group: 'Deadline urgency', ...urgency },
    { group: 'Category importance', ...category },
    { group: 'Estimated effort', ...effort },
    { group: 'Task age', ...age },
    ...status.map((s) => ({ group: 'Status signals', ...s })),
    ...(blocked ? [{ group: 'Dependencies', points: -25, label: 'Waiting for a prerequisite task' }] : []),
  ]

  const score = Math.max(0, Math.min(MAX_SCORE, factors.reduce((sum, f) => sum + f.points, 0)))

  const autoPriority = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const manual = task.priorityMode && task.priorityMode !== 'auto'
  const priority = manual ? task.priorityMode : autoPriority

  return { score, factors, autoPriority, priority, manual, blocked }
}


export function priorityOf(task) {
  return analyze(task).priority
}


export function reasonsFor(task) {
  const { factors, manual, priority } = analyze(task)
  const reasons = factors.filter((f) => f.points > 0).map((f) => f.label)
  if (manual) reasons.unshift(`You manually set this task to ${PRIORITY_META[priority].short} priority`)
  if (!reasons.length) reasons.push('No urgency signals detected yet')
  return reasons
}

const RANK = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }


export function comparePriority(a, b, allTasks = []) {
  const A = analyze(a, { tasks: allTasks })
  const B = analyze(b, { tasks: allTasks })
  if (RANK[A.priority] !== RANK[B.priority]) return RANK[A.priority] - RANK[B.priority]
  const da = daysUntil(a)
  const db = daysUntil(b)
  if (da === null && db !== null) return 1
  if (db === null && da !== null) return -1
  if (da !== db && da !== null && db !== null) return da - db
  if ((a.estimatedMinutes || Infinity) !== (b.estimatedMinutes || Infinity)) return (a.estimatedMinutes || Infinity) - (b.estimatedMinutes || Infinity)
  return B.score - A.score
}

export function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => comparePriority(a, b, tasks))
}


export function focusTask(tasks) {
  return sortByPriority(tasks.filter((t) => !t.completed && !t.archived && !t.deleted && !isBlocked(t, tasks)))[0] || null
}
