import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useApp } from './AppStore.jsx'
import { TaskFormModal } from '../components/TaskFormModal.jsx'
import { TaskDetail } from '../components/TaskDetail.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'

const TaskUIContext = createContext(null)

const CHEERS = [
  '🎉 Great work! Task completed.',
  '🎉 Nice — one less thing to worry about.',
  '🎉 Task completed. Keep the streak going!',
]

export function TaskUIProvider({ children }) {
  const { tasks, setCompleted, deleteTask, restoreTask, toast } = useApp()
  const [form, setForm] = useState({ open: false, mode: 'add', task: null })
  const [detail, setDetail] = useState({ open: false, id: null })
  const [confirm, setConfirm] = useState({ open: false, task: null })

  const liveDetailTask = useMemo(() => tasks.find((t) => t.id === detail.id) || null, [tasks, detail.id])

  const openAdd = useCallback(() => setForm({ open: true, mode: 'add', task: null }), [])
  const openEdit = useCallback((task) => setForm({ open: true, mode: 'edit', task }), [])
  const openDetail = useCallback((task) => setDetail({ open: true, id: task.id }), [])
  const closeDetail = useCallback(() => setDetail({ open: false, id: null }), [])

  const complete = useCallback(
    (task) => {
      setCompleted(task.id, true)
      toast(CHEERS[Math.floor(Math.random() * CHEERS.length)], {
        tone: 'celebrate',
        description: `“${task.title}” moved to Completed Tasks.`,
        actionLabel: 'Undo',
        action: () => setCompleted(task.id, false),
      })
    },
    [setCompleted, toast],
  )

  const reopen = useCallback(
    (task) => {
      setCompleted(task.id, false)
      toast('Task reopened', {
        tone: 'info',
        description: `“${task.title}” is back in your pending list.`,
        actionLabel: 'Undo',
        action: () => setCompleted(task.id, true),
      })
    },
    [setCompleted, toast],
  )

  const toggle = useCallback((task) => (task.completed ? reopen(task) : complete(task)), [complete, reopen])

  const askDelete = useCallback((task) => setConfirm({ open: true, task }), [])

  const doDelete = useCallback(
    (task) => {
      const removed = deleteTask(task.id)
      if (detail.id === task.id) closeDetail()
      toast('Task deleted', {
        tone: 'info',
        description: `“${task.title}” was removed.`,
        actionLabel: 'Undo',
        action: () => restoreTask(removed || task),
      })
    },
    [deleteTask, restoreTask, toast, detail.id, closeDetail],
  )

  const value = useMemo(
    () => ({ openAdd, openEdit, openDetail, askDelete, complete, reopen, toggle }),
    [openAdd, openEdit, openDetail, askDelete, complete, reopen, toggle],
  )

  return (
    <TaskUIContext.Provider value={value}>
      {children}

      <TaskFormModal
        open={form.open}
        mode={form.mode}
        task={form.task}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />

      <TaskDetail
        open={detail.open && Boolean(liveDetailTask)}
        task={liveDetailTask}
        onClose={closeDetail}
        onEdit={(task) => {
          closeDetail()
          openEdit(task)
        }}
        onDelete={(task) => askDelete(task)}
        onToggle={toggle}
      />

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, task: null })}
        onConfirm={() => confirm.task && doDelete(confirm.task)}
        title="Delete task?"
        message="Are you sure you want to delete this task? It will be removed from your dashboard, analytics and reminders."
        highlight={confirm.task?.title}
      />
    </TaskUIContext.Provider>
  )
}

export function useTaskUI() {
  const ctx = useContext(TaskUIContext)
  if (!ctx) throw new Error('useTaskUI must be used inside <TaskUIProvider>')
  return ctx
}
