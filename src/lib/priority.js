/* ---------------------------------------------------------------------------
   Smart Priority Detection
   A transparent scoring model — every point is explainable to the user.
--------------------------------------------------------------------------- */
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
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
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
}

/** Factor 1 — how close is the deadline? */
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

/** Factor 2 — how important is this kind of task? */
export function categoryPoints(task) {
  const points = CATEGORY_WEIGHT[task.category] ?? 5
  return { points, label: `${task.category} category weight` }
}

/** Factor 3 — status & follow-through signals. */
export function statusPoints(task) {
  const out = []
  if (!task.completed) out.push({ points: 10, label: 'Task is still pending' })
  else out.push({ points: 0, label: 'Task is already completed' })
  if (task.reminder && !task.completed) out.push({ points: 5, label: 'A reminder is active' })
  return out
}

export const MAX_SCORE = 100

/**
 * Full breakdown for a task: score, factor rows, resulting priority and whether
 * the user overrode the automatic result.
 */
export function analyze(task) {
  const urgency = urgencyPoints(task)
  const category = categoryPoints(task)
  const status = statusPoints(task)

  const factors = [
    { group: 'Deadline urgency', ...urgency },
    { group: 'Category importance', ...category },
    ...status.map((s) => ({ group: 'Status signals', ...s })),
  ]

  const score = Math.min(
    MAX_SCORE,
    factors.reduce((sum, f) => sum + f.points, 0),
  )

  const autoPriority = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const manual = task.priorityMode && task.priorityMode !== 'auto'
  const priority = manual ? task.priorityMode : autoPriority

  return { score, factors, autoPriority, priority, manual }
}

/** Convenience — just the resolved priority key. */
export function priorityOf(task) {
  return analyze(task).priority
}

/** Human-readable "why is this important?" bullets. */
export function reasonsFor(task) {
  const { factors, manual, priority } = analyze(task)
  const reasons = factors.filter((f) => f.points > 0).map((f) => f.label)
  if (manual) reasons.unshift(`You manually set this task to ${PRIORITY_META[priority].short} priority`)
  if (!reasons.length) reasons.push('No urgency signals detected yet')
  return reasons
}

const RANK = { high: 0, medium: 1, low: 2 }

/** Sort: priority band first, then nearest deadline, then higher score. */
export function comparePriority(a, b) {
  const A = analyze(a)
  const B = analyze(b)
  if (RANK[A.priority] !== RANK[B.priority]) return RANK[A.priority] - RANK[B.priority]
  const da = daysUntil(a)
  const db = daysUntil(b)
  if (da === null && db !== null) return 1
  if (db === null && da !== null) return -1
  if (da !== db && da !== null && db !== null) return da - db
  return B.score - A.score
}

/** The single task the user should do next. */
export function focusTask(tasks) {
  return [...tasks].filter((t) => !t.completed).sort(comparePriority)[0] || null
}
