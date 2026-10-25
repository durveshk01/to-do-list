

export const MS_DAY = 86400000


export function toKey(date = new Date()) {
  const d = new Date(date)
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}


export function keyFromToday(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toKey(d)
}


export function keyOfNextWeekday(weekday) {
  const d = new Date()
  const diff = (weekday - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return toKey(d)
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}


export function dueDateTime(task) {
  if (!task?.dueDate) return null
  const [y, m, d] = task.dueDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const [hh, mm] = (task.dueTime || '23:59').split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}


export function daysUntil(task) {
  const due = dueDateTime(task)
  if (!due) return null
  return Math.round((startOfDay(due) - startOfDay()) / MS_DAY)
}

export function isOverdue(task) {
  const due = dueDateTime(task)
  if (!due || task.completed) return false
  return due.getTime() < Date.now()
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const weekdayShort = (i) => WEEKDAYS[i].slice(0, 3)
export const monthName = (i) => MONTHS[i]

export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  let format = '12h'
  try { format = JSON.parse(localStorage.getItem('smart-todo:settings') || '{}').timeFormat || format } catch { format = '12h' }
  if (format === '24h') return `${`${h}`.padStart(2, '0')}:${`${m}`.padStart(2, '0')}`
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${`${m}`.padStart(2, '0')} ${suffix}`
}

export function formatDate(dateKey) {
  if (!dateKey) return 'No deadline'
  const [y, m, d] = dateKey.split('-').map(Number)
  let format = 'medium'
  try { format = JSON.parse(localStorage.getItem('smart-todo:settings') || '{}').dateFormat || format } catch { format = 'medium' }
  if (format === 'iso') return `${y}-${`${m}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`
  if (format === 'numeric') return `${`${d}`.padStart(2, '0')}/${`${m}`.padStart(2, '0')}/${y}`
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`
}

export function formatDateTime(task) {
  if (!task?.dueDate) return 'No deadline'
  const date = formatDate(task.dueDate)
  return task.dueTime ? `${date}, ${formatTime(task.dueTime)}` : date
}


export function relativeDue(task) {
  const days = daysUntil(task)
  if (days === null) return 'No deadline'
  if (isOverdue(task)) {
    const late = Math.abs(days)
    if (late === 0) return 'Overdue today'
    return `Overdue by ${late} day${late === 1 ? '' : 's'}`
  }
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days < 0) return 'Past deadline'
  if (days <= 6) return `Due in ${days} days`
  if (days <= 13) return 'Due next week'
  return `Due ${formatDate(task.dueDate)}`
}


export function shortDue(task) {
  const days = daysUntil(task)
  if (days === null) return 'No deadline'
  if (isOverdue(task)) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 6) {
    const due = dueDateTime(task)
    return WEEKDAYS[due.getDay()]
  }
  return formatDate(task.dueDate).replace(/ \d{4}$/, '')
}


export function deadlineBucket(task) {
  const days = daysUntil(task)
  if (days === null) return 'later'
  if (isOverdue(task)) return 'overdue'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 7) return 'week'
  return 'later'
}


export function humanStamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.round((startOfDay() - startOfDay(d)) / MS_DAY)
  const time = formatTime(`${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`)
  if (days === 0) return `Today at ${time}`
  if (days === 1) return `Yesterday at ${time}`
  if (days < 7 && days > 0) return `${days} days ago at ${time}`
  return `${formatDate(toKey(d))} at ${time}`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function longToday(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${formatDate(toKey(date))}`
}


export function weekKeys(date = new Date(), startsMonday = true) {
  const d = startOfDay(date)
  const offset = startsMonday ? (d.getDay() + 6) % 7 : d.getDay()
  d.setDate(d.getDate() - offset)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    return toKey(x)
  })
}


export function monthGrid(year, month, startsMonday = true) {
  const first = new Date(year, month, 1)
  const lead = startsMonday ? (first.getDay() + 6) % 7 : first.getDay()
  const start = new Date(year, month, 1 - lead)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { key: toKey(d), date: d, inMonth: d.getMonth() === month, isToday: toKey(d) === toKey() }
  })
}
