import { toKey, weekKeys, weekdayShort } from './date.js'
import { analyze } from './priority.js'

const FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function weeklyCompletion(tasks, startsMonday = true) {
  const keys = weekKeys(new Date(), startsMonday)
  const today = toKey()
  const counts = new Map(keys.map((k) => [k, 0]))
  tasks.forEach((t) => {
    if (!t.completed || !t.completedAt) return
    const key = toKey(new Date(t.completedAt))
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  })
  return keys.map((k) => {
    const date = new Date(`${k}T12:00:00`)
    return {
      key: k,
      label: weekdayShort(date.getDay()),
      full: FULL[(date.getDay() + 6) % 7],
      value: counts.get(k),
      isToday: k === today,
    }
  })
}

export function productivityScore(tasks, stats) {
  if (!tasks.length) return 0
  const completion = stats.percent
  const overduePenalty = Math.min(30, stats.overdue.length * 10)
  const highPenalty = Math.min(15, stats.byPriority.high * 5)
  const week = weeklyCompletion(tasks).reduce((s, d) => s + d.value, 0)
  const momentum = Math.min(20, week * 4)
  return Math.max(0, Math.min(100, Math.round(completion * 0.7 + momentum - overduePenalty * 0.5 - highPenalty * 0.3)))
}

export function motivationalMessage(stats, score) {
  if (stats.total === 0) return 'A clean slate. Add your first task and let Smart Priority take it from there.'
  if (stats.pending === 0) return 'Everything is done. Genuinely impressive — take the evening off.'
  if (stats.overdue.length) return 'A couple of deadlines slipped past. Clear those first and the rest gets easy.'
  if (score >= 75) return "You're on a roll. Keep the momentum going with the task below."
  if (stats.byPriority.high) return 'Start with the high-priority task — the rest of the day gets lighter after it.'
  return 'Small steps count. Finish one task now and your progress moves.'
}

export function categoryBreakdown(tasks) {
  const map = new Map()
  tasks.forEach((t) => {
    const row = map.get(t.category) || { category: t.category, total: 0, completed: 0, pending: 0 }
    row.total += 1
    if (t.completed) row.completed += 1
    else row.pending += 1
    map.set(t.category, row)
  })
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export function priorityBreakdown(tasks) {
  const out = { high: 0, medium: 0, low: 0 }
  tasks.forEach((t) => {
    const priority = analyze(t).priority
    out[priority === 'urgent' ? 'high' : priority === 'none' ? 'low' : priority] += 1
  })
  return out
}

export function streakSummary(tasks, now = new Date()) {
  const days = new Set(tasks.filter((task) => task.completedAt).map((task) => toKey(new Date(task.completedAt))))
  const today = toKey(now)
  const yesterday = toKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  let current = 0
  let cursor = days.has(today) ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (days.has(today) || days.has(yesterday)) {
    while (days.has(toKey(cursor))) {
      current += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }
  const ordered = [...days].sort()
  let longest = 0
  let run = 0
  let previous = null
  ordered.forEach((key) => {
    const currentDate = new Date(`${key}T12:00:00`)
    const gap = previous ? Math.round((currentDate - previous) / 86_400_000) : 0
    run = gap === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = currentDate
  })
  return { current, longest, activeDays: days.size }
}
