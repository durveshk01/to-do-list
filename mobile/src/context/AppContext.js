import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { seedTasks } from '../data/sampleTasks.js'
import { normalizeTask } from '../lib/taskModel.js'
import { analyze, sortByPriority } from '../lib/priority.js'
import { daysUntil, isOverdue } from '../lib/date.js'

const AppContext = createContext(null)

const KEYS = {
  tasks: 'taskflow_tasks',
  user: 'taskflow_user',
  settings: 'taskflow_settings',
  focusSessions: 'taskflow_focus_sessions',
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  accentColor: '#5b5bd6',
  defaultCategory: 'Academic',
  defaultDuration: 30,
}

const uid = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [user, setUser] = useState({ name: 'Durvesh', email: 'durvesh@student.edu' })
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [focusSessions, setFocusSessions] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Load persisted state
  useEffect(() => {
    async function init() {
      try {
        const storedTasks = await AsyncStorage.getItem(KEYS.tasks)
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks).map(normalizeTask))
        } else {
          setTasks(seedTasks().map(normalizeTask))
        }

        const storedUser = await AsyncStorage.getItem(KEYS.user)
        if (storedUser) setUser(JSON.parse(storedUser))

        const storedSettings = await AsyncStorage.getItem(KEYS.settings)
        if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) })

        const storedSessions = await AsyncStorage.getItem(KEYS.focusSessions)
        if (storedSessions) setFocusSessions(JSON.parse(storedSessions))
      } catch (e) {
        setTasks(seedTasks().map(normalizeTask))
      } finally {
        setLoaded(true)
      }
    }
    init()
  }, [])

  // Persist tasks
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(KEYS.tasks, JSON.stringify(tasks)).catch(() => {})
    }
  }, [tasks, loaded])

  // Persist sessions
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(KEYS.focusSessions, JSON.stringify(focusSessions)).catch(() => {})
    }
  }, [focusSessions, loaded])

  const addTask = (draft) => {
    const timestamp = new Date().toISOString()
    const task = normalizeTask({
      ...draft,
      id: uid(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    setTasks((list) => [task, ...list])
    return task
  }

  const updateTask = (id, patch) => {
    const timestamp = new Date().toISOString()
    setTasks((list) =>
      list.map((task) => (task.id === id ? normalizeTask({ ...task, ...patch, id, updatedAt: timestamp }) : task)),
    )
  }

  const deleteTask = (id) => {
    setTasks((list) => list.filter((task) => task.id !== id))
  }

  const toggleComplete = (id) => {
    const timestamp = new Date().toISOString()
    setTasks((list) =>
      list.map((task) => {
        if (task.id !== id) return task
        const nextCompleted = !task.completed
        return normalizeTask({
          ...task,
          completed: nextCompleted,
          status: nextCompleted ? 'completed' : 'todo',
          completedAt: nextCompleted ? timestamp : null,
          updatedAt: timestamp,
        })
      }),
    )
  }

  const toggleFavorite = (id) => {
    setTasks((list) =>
      list.map((task) => (task.id === id ? normalizeTask({ ...task, favorite: !task.favorite }) : task)),
    )
  }

  const addFocusSession = (session) => {
    setFocusSessions((list) => [{ id: uid(), ...session, createdAt: new Date().toISOString() }, ...list].slice(0, 500))
  }

  const resetData = () => {
    setTasks(seedTasks().map(normalizeTask))
    setFocusSessions([])
  }

  const stats = useMemo(() => {
    const visible = tasks.filter((t) => !t.deleted && !t.archived)
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

    return {
      total: visible.length,
      completed: completed.length,
      pending: pending.length,
      byPriority,
      overdue,
      dueToday,
      percent,
      urgentCount,
    }
  }, [tasks])

  const sortedByPriority = useMemo(() => sortByPriority(tasks.filter((t) => !t.completed)), [tasks])

  return (
    <AppContext.Provider
      value={{
        tasks,
        user,
        settings,
        setSettings,
        stats,
        sortedByPriority,
        focusSessions,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        toggleFavorite,
        addFocusSession,
        resetData,
        loaded,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
