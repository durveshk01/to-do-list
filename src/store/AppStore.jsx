import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedTasks } from '../data/sampleTasks.js'
import { KEYS, clearAll, load, save } from '../lib/storage.js'
import { analyze, comparePriority } from '../lib/priority.js'
import { daysUntil, dueDateTime, isOverdue } from '../lib/date.js'

const AppContext = createContext(null)

const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultCategory: 'Academic',
  defaultReminder: true,
  defaultReminderOffset: '1h',
  browserNotifications: false,
  motivationalMessages: true,
  weekStartsMonday: true,
}

const uid = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function normalize(task) {
  return {
    id: task.id || uid(),
    title: (task.title || '').trim(),
    description: task.description || '',
    category: task.category || 'Other',
    dueDate: task.dueDate || '',
    dueTime: task.dueTime || '',
    priorityMode: task.priorityMode || 'auto',
    reminder: Boolean(task.reminder),
    reminderOffset: task.reminderOffset || 'at',
    completed: Boolean(task.completed),
    completedAt: task.completedAt || null,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
  }
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState(() => (load(KEYS.tasks, null) ?? seedTasks()).map(normalize))
  const [user, setUser] = useState(() => load(KEYS.user, null))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) }))
  const [notifState, setNotifState] = useState(() => load(KEYS.notifications, { read: [], cleared: [] }))
  const [toasts, setToasts] = useState([])
  const [, forceTick] = useState(0)
  const timers = useRef(new Map())

  /* ---- persistence ---- */
  useEffect(() => save(KEYS.tasks, tasks), [tasks])
  useEffect(() => save(KEYS.user, user), [user])
  useEffect(() => save(KEYS.settings, settings), [settings])
  useEffect(() => save(KEYS.notifications, notifState), [notifState])

  /* ---- theme ---- */
  useEffect(() => {
    const root = document.documentElement
    const apply = (dark) => root.classList.toggle('dark', dark)
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const onChange = (e) => apply(e.matches)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    apply(settings.theme === 'dark')
  }, [settings.theme])

  /* ---- keep relative deadlines fresh while the tab stays open ---- */
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  /* ---- toasts ---- */
  const dismissToast = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, options = {}) => {
      const id = uid()
      const entry = {
        id,
        message,
        tone: options.tone || 'success',
        description: options.description,
        action: options.action,
        actionLabel: options.actionLabel,
      }
      setToasts((list) => [...list.slice(-2), entry])
      const timeout = setTimeout(() => dismissToast(id), options.duration ?? 4600)
      timers.current.set(id, timeout)
      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  /* ---- auth (demo only) ---- */
  const login = useCallback((email, remember) => {
    const handle = email.split('@')[0].replace(/[._-]+/g, ' ')
    const name = handle
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ')
    setUser({ name: name || 'Student', email, remember: Boolean(remember), since: new Date().toISOString() })
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const updateUser = useCallback((patch) => setUser((u) => ({ ...(u || {}), ...patch })), [])

  /* ---- task CRUD ---- */
  const addTask = useCallback((draft) => {
    const task = normalize({ ...draft, id: uid(), createdAt: new Date().toISOString() })
    setTasks((list) => [task, ...list])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setTasks((list) =>
      list.map((t) => (t.id === id ? normalize({ ...t, ...patch, id, updatedAt: new Date().toISOString() }) : t)),
    )
  }, [])

  const deleteTask = useCallback((id) => {
    let removed = null
    setTasks((list) => {
      removed = list.find((t) => t.id === id) || null
      return list.filter((t) => t.id !== id)
    })
    return removed
  }, [])

  const restoreTask = useCallback((task) => {
    if (!task) return
    setTasks((list) => (list.some((t) => t.id === task.id) ? list : [task, ...list]))
  }, [])

  const setCompleted = useCallback((id, completed) => {
    setTasks((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
  }, [])

  const toggleComplete = useCallback(
    (id) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      setCompleted(id, !task.completed)
    },
    [tasks, setCompleted],
  )

  const resetData = useCallback(() => {
    setTasks(seedTasks().map(normalize))
    setNotifState({ read: [], cleared: [] })
  }, [])

  const clearEverything = useCallback(() => {
    clearAll()
    setTasks([])
    setNotifState({ read: [], cleared: [] })
    setUser(null)
    setSettings(DEFAULT_SETTINGS)
  }, [])

  /* ---- derived stats ---- */
  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed)
    const pending = tasks.filter((t) => !t.completed)
    const byPriority = { high: 0, medium: 0, low: 0 }
    pending.forEach((t) => {
      byPriority[analyze(t).priority] += 1
    })
    const overdue = pending.filter(isOverdue)
    const dueToday = pending.filter((t) => daysUntil(t) === 0 && !isOverdue(t))
    const percent = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0
    const urgentCount = byPriority.high + overdue.length
    return {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      byPriority,
      overdue,
      dueToday,
      percent,
      urgentCount,
      completedList: completed,
      pendingList: pending,
    }
  }, [tasks])

  /* ---- notifications derived from live task data ---- */
  const notifications = useMemo(() => {
    const cleared = new Set(notifState.cleared)
    const read = new Set(notifState.read)
    const items = []

    tasks.forEach((task) => {
      const priority = analyze(task).priority
      if (!task.completed) {
        const days = daysUntil(task)
        if (isOverdue(task)) {
          items.push({
            id: `${task.id}:overdue`,
            group: 'urgent',
            taskId: task.id,
            priority,
            title: `${task.title} is overdue!`,
            body: 'This deadline has already passed. Reschedule it or finish it now.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days === 0) {
          items.push({
            id: `${task.id}:today`,
            group: 'urgent',
            taskId: task.id,
            priority,
            title: `${task.title} is due today!`,
            body: 'Today is the deadline — keep this one at the top of your list.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days === 1) {
          items.push({
            id: `${task.id}:tomorrow`,
            group: 'upcoming',
            taskId: task.id,
            priority,
            title: `${task.title} is due tomorrow!`,
            body: task.reminder ? 'Your reminder is switched on for this task.' : 'No reminder set for this task yet.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days !== null && days <= 3) {
          items.push({
            id: `${task.id}:soon`,
            group: 'upcoming',
            taskId: task.id,
            priority,
            title: `${task.title} is due in ${days} days.`,
            body: `${task.category} • plan a slot for it this week.`,
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        }
      } else if (task.completedAt) {
        items.push({
          id: `${task.id}:done`,
          group: 'completed',
          taskId: task.id,
          priority: 'completed',
          title: `${task.title} completed`,
          body: 'Nice work — this one is off your list.',
          at: task.completedAt,
        })
      }
    })

    return items
      .filter((n) => !cleared.has(n.id))
      .map((n) => ({ ...n, read: read.has(n.id) }))
      .sort((a, b) => {
        const rank = { urgent: 0, upcoming: 1, completed: 2 }
        if (rank[a.group] !== rank[b.group]) return rank[a.group] - rank[b.group]
        return new Date(a.at) - new Date(b.at)
      })
  }, [tasks, notifState])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markNotificationRead = useCallback((id) => {
    setNotifState((s) => (s.read.includes(id) ? s : { ...s, read: [...s.read, id] }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifState((s) => ({ ...s, read: [...new Set([...s.read, ...notifications.map((n) => n.id)])] }))
  }, [notifications])

  const clearNotification = useCallback((id) => {
    setNotifState((s) => ({ ...s, cleared: [...new Set([...s.cleared, id])] }))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifState((s) => ({ ...s, cleared: [...new Set([...s.cleared, ...notifications.map((n) => n.id)])] }))
  }, [notifications])

  const restoreNotifications = useCallback(() => setNotifState({ read: [], cleared: [] }), [])

  /* ---- optional browser reminders for urgent items ---- */
  const notified = useRef(new Set())
  useEffect(() => {
    if (!settings.browserNotifications) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    notifications
      .filter((n) => n.group === 'urgent' && !n.read && !notified.current.has(n.id))
      .slice(0, 2)
      .forEach((n) => {
        notified.current.add(n.id)
        try {
          new Notification('Smart To-Do', { body: n.title, icon: '/logo.svg', tag: n.id })
        } catch {
          /* browser blocked it — the in-app centre still shows everything */
        }
      })
  }, [notifications, settings.browserNotifications])

  const sortedByPriority = useMemo(() => [...tasks].sort(comparePriority), [tasks])

  const value = useMemo(
    () => ({
      tasks,
      sortedByPriority,
      stats,
      user,
      settings,
      setSettings,
      login,
      logout,
      updateUser,
      addTask,
      updateTask,
      deleteTask,
      restoreTask,
      toggleComplete,
      setCompleted,
      resetData,
      clearEverything,
      toasts,
      toast,
      dismissToast,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      clearAllNotifications,
      restoreNotifications,
    }),
    [
      tasks,
      sortedByPriority,
      stats,
      user,
      settings,
      login,
      logout,
      updateUser,
      addTask,
      updateTask,
      deleteTask,
      restoreTask,
      toggleComplete,
      setCompleted,
      resetData,
      clearEverything,
      toasts,
      toast,
      dismissToast,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotification,
      clearAllNotifications,
      restoreNotifications,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
