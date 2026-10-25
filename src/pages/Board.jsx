import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, CirclePlus, KanbanSquare, Plus, Workflow } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { TaskCard } from '../components/TaskCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'

const COLUMNS = [
  { id: 'inbox', title: 'Inbox', accent: 'bg-slate-400' },
  { id: 'todo', title: 'To do', accent: 'bg-accent' },
  { id: 'in-progress', title: 'In progress', accent: 'bg-medium' },
  { id: 'completed', title: 'Completed', accent: 'bg-done' },
]

export function Board() {
  const { tasks, setTaskStatus, updateTask } = useApp()
  const { openAdd } = useTaskUI()
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const columns = useMemo(() => COLUMNS.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => !task.archived && (task.completed ? column.id === 'completed' : (task.status || 'todo') === column.id)).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || new Date(a.createdAt) - new Date(b.createdAt)),
  })), [tasks])

  const handleDrop = (event, columnId) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/taskflow-task') || dragId
    if (!taskId) return
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    if (columnId === 'completed') setTaskStatus(taskId, 'completed')
    else setTaskStatus(taskId, columnId)
    const columnItems = columns.find((column) => column.id === columnId)?.tasks || []
    updateTask(taskId, { order: Math.max(-1, ...columnItems.map((item) => Number(item.order) || 0)) + 1 })
    setDragId(null)
    setDragOver(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={KanbanSquare} eyebrow="Workflow" title="Task board" subtitle="Move work across your workflow. Status is saved as soon as a card lands." actions={<button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={16} />Add task</button>} />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {columns.map((column) => (
          <section key={column.id} onDragOver={(event) => { event.preventDefault(); setDragOver(column.id) }} onDragLeave={() => setDragOver(null)} onDrop={(event) => handleDrop(event, column.id)} className={`min-h-64 rounded-2xl border p-3 transition ${dragOver === column.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2'}`} aria-label={`${column.title} tasks`}>
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink"><span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />{column.title}</h2>
              <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink-2">{column.tasks.length}</span>
            </header>
            <div className="space-y-2.5">
              {column.tasks.map((task) => <div key={task.id} draggable={!task.completed} onDragStart={(event) => { event.dataTransfer.setData('text/taskflow-task', task.id); setDragId(task.id) }} onDragEnd={() => { setDragId(null); setDragOver(null) }} className={`transition-opacity ${dragId === task.id ? 'opacity-40' : ''}`}><TaskCard task={task} compact /></div>)}
              {column.tasks.length === 0 && <div className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-3">Drop a task here</div>}
            </div>
            {column.id === 'inbox' && <button type="button" onClick={openAdd} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-2 text-xs font-semibold text-ink-2 transition hover:border-accent hover:text-accent"><CirclePlus size={14} />Quick add</button>}
          </section>
        ))}
      </div>
      <section className="card flex items-start gap-3 p-4 text-sm text-ink-2"><Workflow className="mt-0.5 shrink-0 text-accent" size={17} /><p>Drag and drop tasks between columns. Use the task menu to edit details, change priority, favorite, or archive work.</p><ArrowDownWideNarrow className="ml-auto hidden shrink-0 text-ink-3 sm:block" size={17} /></section>
      {!tasks.length && <EmptyState icon={KanbanSquare} title="Your board is ready" message="Add a task and move it through your workflow." actionLabel="Create a task" onAction={openAdd} />}
    </div>
  )
}
