import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedTasks } from '../data/sampleTasks.js'
import { KEYS, clearAll, load, save } from '../lib/storage.js'
import { analyze, sortByPriority } from '../lib/priority.js'
import { daysUntil, dueDateTime, isOverdue, toKey } from '../lib/date.js'
import { addActivity, nextRecurringTask, normalizeTask, validateTaskCollection } from '../lib/taskModel.js'
import { haptic, updateStatusBar, hideSplashScreen, initNativeSystemBars } from '../lib/native.js'

const AppContext = createContext(null)

const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultCategory: 'Academic',
  defaultReminder: true,
  defaultReminderOffset: '1h',
  browserNotifications: false,
  motivationalMessages: true,
  weekStartsMonday: true,
  dateFormat: 'medium',
  timeFormat: '12h',
  defaultPriority: 'auto',
  defaultDuration: 30,
  autoArchiveCompleted: false,
  confirmBeforeDelete: true,
  compactMode: false,
  notificationOverdue: true,
  notificationUpcoming: true,
  notificationStreak: false,
  customCategories: [],
  accentColor: 'indigo',
}

const uid = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function loadTasks() {
  const stored = load(KEYS.tasks, null)
  if (!Array.isArray(stored)) return seedTasks().map(normalizeTask)
  const validated = validateTaskCollection(stored)
  if (validated.valid) return validated.tasks
  const ids = new Set()
  return stored.filter((task) => {
    if (!task || typeof task !== 'object' || typeof task.title !== 'string' || !task.title.trim()) return false
    if (task.id && ids.has(String(task.id))) return false
    if (task.id) ids.add(String(task.id))
    return true
  }).map(normalizeTask)
}

function loadSettings() {
  const stored = load(KEYS.settings, {})
  const value = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  const settings = { ...DEFAULT_SETTINGS, ...value }
  settings.theme = ['light', 'dark', 'system'].includes(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme
  settings.accentColor = ['indigo', 'violet', 'cyan', 'emerald', 'rose'].includes(settings.accentColor) ? settings.accentColor : 'indigo'
  settings.defaultPriority = ['auto', 'none', 'low', 'medium', 'high', 'urgent'].includes(settings.defaultPriority) ? settings.defaultPriority : 'auto'
  settings.dateFormat = ['medium', 'numeric', 'iso'].includes(settings.dateFormat) ? settings.dateFormat : 'medium'
  settings.timeFormat = ['12h', '24h'].includes(settings.timeFormat) ? settings.timeFormat : '12h'
  settings.defaultCategory = typeof settings.defaultCategory === 'string' ? settings.defaultCategory.slice(0, 60) : 'Academic'
  settings.defaultDuration = [15, 25, 30, 45, 60, 90].includes(Number(settings.defaultDuration)) ? Number(settings.defaultDuration) : 30
  settings.defaultReminderOffset = ['at', '15m', '30m', '1h', '1d'].includes(settings.defaultReminderOffset) ? settings.defaultReminderOffset : '1h'
  settings.customCategories = Array.isArray(settings.customCategories) ? [...new Set(settings.customCategories.filter((item) => typeof item === 'string').map((item) => item.trim().slice(0, 40)).filter(Boolean))].slice(0, 40) : []
  for (const key of ['defaultReminder', 'browserNotifications', 'motivationalMessages', 'weekStartsMonday', 'autoArchiveCompleted', 'confirmBeforeDelete', 'compactMode', 'notificationOverdue', 'notificationUpcoming', 'notificationStreak']) settings[key] = Boolean(settings[key])
  return settings
}

function loadUser() {
  const value = load(KEYS.user, null)
  return value && typeof value === 'object' && typeof value.name === 'string' && typeof value.email === 'string' ? value : null
}

function loadNotifications() {
  const value = load(KEYS.notifications, {})
  return { read: Array.isArray(value?.read) ? value.read.filter((item) => typeof item === 'string') : [], cleared: Array.isArray(value?.cleared) ? value.cleared.filter((item) => typeof item === 'string') : [] }
}

function loadFocusSessions() {
  const value = load(KEYS.focusSessions, [])
  return Array.isArray(value) ? value.filter((session) => session && typeof session === 'object' && Number.isFinite(Number(session.actualMinutes))).slice(0, 500) : []
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState(loadTasks)
  const [user, setUser] = useState(loadUser)
  const [settings, setSettings] = useState(loadSettings)
  const [notifState, setNotifState] = useState(loadNotifications)
  const [focusSessions, setFocusSessions] = useState(loadFocusSessions)
  const [toasts, setToasts] = useState([])
  const [, forceTick] = useState(0)
  const timers = useRef(new Map())

  
  useEffect(() => save(KEYS.tasks, tasks), [tasks])
  useEffect(() => save(KEYS.user, user), [user])
  useEffect(() => save(KEYS.settings, settings), [settings])
  useEffect(() => save(KEYS.notifications, notifState), [notifState])
  useEffect(() => save(KEYS.focusSessions, focusSessions), [focusSessions])

  
  useEffect(() => {
    initNativeSystemBars()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark) => {
      root.classList.toggle('dark', dark)
      updateStatusBar(dark)
    }
    hideSplashScreen()
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const onChange = (e) => apply(e.matches)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    apply(settings.theme === 'dark')
  }, [settings.theme])

  useEffect(() => {
    const root = document.documentElement
    const colors = { indigo: '#5b5bd6', violet: '#7c3aed', cyan: '#0891b2', emerald: '#059669', rose: '#e11d48' }
    const color = colors[settings.accentColor] || colors.indigo
    root.style.setProperty('--accent', color)
    root.style.setProperty('--ring', color)
    root.classList.toggle('compact', Boolean(settings.compactMode))
  }, [settings.accentColor, settings.compactMode])

  
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!settings.autoArchiveCompleted) return
    const archiveOld = () => setTasks((list) => {
      let changed = false
      const next = list.map((task) => {
        if (!task.archiveAfter || Date.parse(task.archiveAfter) > Date.now() || task.archived) return task
        changed = true
        return normalizeTask({ ...task, archived: true, status: 'archived' })
      })
      return changed ? next : list
    })
    archiveOld()
    const id = setInterval(archiveOld, 60_000)
    return () => clearInterval(id)
  }, [settings.autoArchiveCompleted])

  
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

  
  const addTask = useCallback((draft) => {
    haptic.light()
    const timestamp = new Date().toISOString()
    const task = normalizeTask({ ...draft, id: uid(), createdAt: timestamp, updatedAt: timestamp, activity: [{ id: uid(), type: 'created', at: timestamp, text: 'Task created' }] })
    setTasks((list) => [task, ...list])
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    const timestamp = new Date().toISOString()
    setTasks((list) => list.map((task) => {
      if (task.id !== id) return task
      const activityText = patch.dueDate && patch.dueDate !== task.dueDate
        ? 'Deadline changed'
        : patch.priorityMode && patch.priorityMode !== task.priorityMode
          ? 'Priority changed'
          : 'Task details updated'
      return normalizeTask({ ...task, ...patch, id, updatedAt: timestamp, activity: addActivity(task, 'updated', activityText, timestamp) })
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    haptic.medium()
    const removed = tasks.find((task) => task.id === id) || null
    if (!removed) return null
    const timestamp = new Date().toISOString()
    setTasks((list) => list.map((task) => task.id === id ? normalizeTask({ ...task, deleted: true, updatedAt: timestamp, activity: addActivity(task, 'deleted', 'Moved to trash', timestamp) }) : task))
    return removed
  }, [tasks])

  const restoreTask = useCallback((task) => {
    if (!task) return
    setTasks((list) => {
      const exists = list.some((item) => item.id === task.id)
      const restored = normalizeTask({ ...task, deleted: false, updatedAt: new Date().toISOString(), activity: addActivity(task, 'restored', 'Restored from trash') })
      return exists ? list.map((item) => item.id === task.id ? restored : item) : [restored, ...list]
    })
  }, [])

  const setCompleted = useCallback((id, completed) => {
    if (completed) haptic.success()
    else haptic.light()
    const timestamp = new Date().toISOString()
    setTasks((list) => {
      const task = list.find((item) => item.id === id)
      if (!task || task.completed === completed) return list
      const updated = normalizeTask({
        ...task,
        completed,
        status: completed ? 'completed' : task.status === 'completed' ? 'todo' : task.status,
        completedAt: completed ? timestamp : null,
        archiveAfter: completed && settings.autoArchiveCompleted ? new Date(Date.now() + 7 * 86_400_000).toISOString() : null,
        updatedAt: timestamp,
        activity: addActivity(task, completed ? 'completed' : 'reopened', completed ? 'Task completed' : 'Task reopened', timestamp),
      })
      let next = list.map((item) => item.id === id ? updated : item)
      if (completed) {
        const recurring = nextRecurringTask(updated, new Date(timestamp))
        if (recurring) next.unshift(recurring)
      } else {
        next = next.filter((item) => !(item.generatedFrom === id && item.generationAt === task.completedAt))
      }
      return next
    })
  }, [settings.autoArchiveCompleted])

  const setTaskStatus = useCallback((id, status) => {
    if (status === 'completed') {
      setCompleted(id, true)
      return
    }
    const existing = tasks.find((task) => task.id === id)
    if (existing?.completed) {
      setCompleted(id, false)
      if (status !== 'todo') setTasks((list) => list.map((task) => task.id === id ? normalizeTask({ ...task, status }) : task))
      return
    }
    const timestamp = new Date().toISOString()
    setTasks((list) => list.map((task) => task.id !== id ? task : normalizeTask({
      ...task,
      status,
      completed: status === 'completed',
      completedAt: status === 'completed' ? task.completedAt || timestamp : null,
      updatedAt: timestamp,
      activity: addActivity(task, 'status', `Status changed to ${status.replace('-', ' ')}`, timestamp),
    })))
  }, [setCompleted, tasks])

  const toggleFavorite = useCallback((id) => {
    haptic.selection()
    setTasks((list) => list.map((task) => task.id === id ? normalizeTask({ ...task, favorite: !task.favorite, updatedAt: new Date().toISOString() }) : task))
  }, [])

  const archiveTask = useCallback((id, archived = true) => {
    haptic.light()
    const timestamp = new Date().toISOString()
    setTasks((list) => list.map((task) => task.id === id ? normalizeTask({ ...task, archived, status: archived ? 'archived' : 'todo', updatedAt: timestamp, activity: addActivity(task, archived ? 'archived' : 'restored', archived ? 'Task archived' : 'Task restored', timestamp) }) : task))
  }, [])

  const restoreDeletedTask = useCallback((id) => {
    setTasks((list) => list.map((task) => task.id === id ? normalizeTask({ ...task, deleted: false, updatedAt: new Date().toISOString() }) : task))
  }, [])

  const deleteForever = useCallback((id) => setTasks((list) => list.filter((task) => task.id !== id)), [])

  const replaceTasks = useCallback((value) => {
    const result = validateTaskCollection(value)
    if (!result.valid) return result
    setTasks(result.tasks)
    setNotifState({ read: [], cleared: [] })
    return { valid: true, count: result.tasks.length }
  }, [])

  const addFocusSession = useCallback((session) => {
    setFocusSessions((list) => [{ id: uid(), ...session, createdAt: new Date().toISOString() }, ...list].slice(0, 500))
  }, [])

  const restoreFocusSessions = useCallback((sessions) => {
    if (!Array.isArray(sessions)) return
    setFocusSessions(sessions.filter((session) => session && Number.isFinite(Number(session.actualMinutes))).slice(0, 500))
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
    setTasks(seedTasks().map(normalizeTask))
    setNotifState({ read: [], cleared: [] })
    setFocusSessions([])
  }, [])

  const clearEverything = useCallback(() => {
    clearAll()
    setTasks([])
    setNotifState({ read: [], cleared: [] })
    setUser(null)
    setSettings(DEFAULT_SETTINGS)
    setFocusSessions([])
  }, [])

  
  const stats = useMemo(() => {
    const visible = tasks.filter((task) => !task.deleted && !task.archived)
    const completed = visible.filter((t) => t.completed)
    const pending = visible.filter((t) => !t.completed)
    const byPriority = { high: 0, medium: 0, low: 0 }
    pending.forEach((t) => {
      const priority = analyze(t, { tasks: visible }).priority
      byPriority[priority === 'urgent' ? 'high' : priority === 'none' ? 'low' : priority] += 1
    })
    const overdue = pending.filter(isOverdue)
    const dueToday = pending.filter((t) => daysUntil(t) === 0 && !isOverdue(t))
    const percent = visible.length ? Math.round((completed.length / visible.length) * 100) : 0
    const urgentCount = byPriority.high + overdue.length
    const todayKey = new Date().toDateString()
    const completedToday = completed.filter((task) => task.completedAt && new Date(task.completedAt).toDateString() === todayKey).length
    const createdToday = visible.filter((task) => new Date(task.createdAt).toDateString() === todayKey).length
    return {
      total: visible.length,
      completed: completed.length,
      pending: pending.length,
      byPriority,
      overdue,
      dueToday,
      completedToday,
      createdToday,
      percent,
      urgentCount,
      completedList: completed,
      pendingList: pending,
    }
  }, [tasks])

  
  const notifications = useMemo(() => {
    const cleared = new Set(notifState.cleared)
    const read = new Set(notifState.read)
    const items = []

    tasks.filter((task) => !task.deleted && !task.archived).forEach((task) => {
      const priority = analyze(task).priority
      if (!task.completed) {
        const days = daysUntil(task)
        if (isOverdue(task) && settings.notificationOverdue) {
          items.push({
            id: `${task.id}:overdue`,
            group: 'urgent',
            taskId: task.id,
            priority,
            title: `${task.title} is overdue!`,
            body: 'This deadline has already passed. Reschedule it or finish it now.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days === 0 && settings.notificationUpcoming) {
          items.push({
            id: `${task.id}:today`,
            group: 'urgent',
            taskId: task.id,
            priority,
            title: `${task.title} is due today!`,
            body: 'Today is the deadline — keep this one at the top of your list.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days === 1 && settings.notificationUpcoming) {
          items.push({
            id: `${task.id}:tomorrow`,
            group: 'upcoming',
            taskId: task.id,
            priority,
            title: `${task.title} is due tomorrow!`,
            body: task.reminder ? 'Your reminder is switched on for this task.' : 'No reminder set for this task yet.',
            at: dueDateTime(task)?.toISOString() || task.updatedAt,
          })
        } else if (days !== null && days <= 3 && settings.notificationUpcoming) {
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

    if (settings.notificationStreak) {
      const today = toKey()
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = toKey(yesterdayDate)
      const completedToday = tasks.some((task) => task.completedAt && toKey(new Date(task.completedAt)) === today)
      const completedYesterday = tasks.some((task) => task.completedAt && toKey(new Date(task.completedAt)) === yesterday)
      if (completedYesterday && !completedToday) items.push({ id: `streak:${today}`, group: 'upcoming', taskId: null, priority: 'medium', title: 'Keep your streak alive today', body: 'You completed a task yesterday. Finish one task today to keep the momentum going.', at: new Date().toISOString() })
    }

    return items
      .filter((n) => !cleared.has(n.id))
      .map((n) => ({ ...n, read: read.has(n.id) }))
      .sort((a, b) => {
        const rank = { urgent: 0, upcoming: 1, completed: 2 }
        if (rank[a.group] !== rank[b.group]) return rank[a.group] - rank[b.group]
        return new Date(a.at) - new Date(b.at)
      })
  }, [tasks, notifState, settings.notificationOverdue, settings.notificationUpcoming, settings.notificationStreak])

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
          
        }
      })
  }, [notifications, settings.browserNotifications])

  const activeTasks = useMemo(() => tasks.filter((task) => !task.deleted && !task.archived), [tasks])
  const trashTasks = useMemo(() => tasks.filter((task) => task.deleted), [tasks])
  const archivedTasks = useMemo(() => tasks.filter((task) => task.archived && !task.deleted), [tasks])
  const sortedByPriority = useMemo(() => sortByPriority(activeTasks), [activeTasks])

  const value = useMemo(
    () => ({
      tasks: activeTasks,
      allTasks: tasks,
      trashTasks,
      archivedTasks,
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
      setTaskStatus,
      toggleFavorite,
      archiveTask,
      restoreDeletedTask,
      deleteForever,
      replaceTasks,
      focusSessions,
      addFocusSession,
      restoreFocusSessions,
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
      activeTasks,
      tasks,
      trashTasks,
      archivedTasks,
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
      setTaskStatus,
      toggleFavorite,
      archiveTask,
      restoreDeletedTask,
      deleteForever,
      replaceTasks,
      focusSessions,
      addFocusSession,
      restoreFocusSessions,
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
