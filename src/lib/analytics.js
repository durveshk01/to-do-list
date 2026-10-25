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
  }})
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
  return 'Small steps count. Finish one task now and your progress ring moves.'
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

export function completionInsights(tasks, focusSessions = []) {
  const completed = tasks.filter((task) => task.completedAt)
  const weekdays = new Map(FULL.map((day) => [day, 0]))
  const hours = new Map()
  completed.forEach((task) => {
    const date = new Date(task.completedAt)
    weekdays.set(FULL[(date.getDay() + 6) % 7], (weekdays.get(FULL[(date.getDay() + 6) % 7]) || 0) + 1)
    hours.set(date.getHours(), (hours.get(date.getHours()) || 0) + 1)
  })
  const bestDay = [...weekdays].sort((a, b) => b[1] - a[1])[0]
  const bestHour = [...hours].sort((a, b) => b[1] - a[1])[0]
  const minutes = focusSessions.reduce((sum, session) => sum + Number(session.actualMinutes || 0), 0)
  const focusCount = focusSessions.length
  return {
    completedCount: completed.length,
    bestDay: bestDay?.[1] ? bestDay[0] : null,
    bestHour: bestHour?.[1] ? `${String(bestHour[0]).padStart(2, '0')}:00` : null,
    averageFocusMinutes: focusCount ? Math.round(minutes / focusCount) : 0,
    averageCompletionMinutes: completed.filter((task) => task.actualMinutes > 0).length ? Math.round(completed.reduce((sum, task) => sum + (Number(task.actualMinutes) || 0), 0) / completed.filter((task) => task.actualMinutes > 0).length) : 0,
    focusMinutes: minutes,
    focusCount,
  }
}

export function completionRange(tasks, days = 7, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)
  return tasks.filter((task) => task.completedAt && new Date(task.completedAt) >= start && new Date(task.completedAt) <= now)
}

export function activityHeatmap(tasks, days = 91, now = new Date()) {
  const completed = new Map()
  const created = new Map()
  tasks.forEach((task) => {
    if (task.completedAt) {
      const key = toKey(new Date(task.completedAt))
      completed.set(key, (completed.get(key) || 0) + 1)
    }
    if (task.createdAt) {
      const key = toKey(new Date(task.createdAt))
      created.set(key, (created.get(key) || 0) + 1)
    }
  })
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + index + 1)
    const key = toKey(date)
    return { key, completed: completed.get(key) || 0, created: created.get(key) || 0 }
  })
}
