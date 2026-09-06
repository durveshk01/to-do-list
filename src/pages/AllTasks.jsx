import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, ListChecks, ListFilter, Plus, Rows3, Search, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { TaskCard } from '../components/TaskCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { analyze, comparePriority } from '../lib/priority.js'
import { dueDateTime, isOverdue } from '../lib/date.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High Priority' },
  { key: 'medium', label: 'Medium Priority' },
  { key: 'low', label: 'Low Priority' },
  { key: 'Academic', label: 'Academic' },
  { key: 'Personal', label: 'Personal' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
]

const SORTS = [
  { key: 'priority', label: 'Smart priority' },
  { key: 'deadline', label: 'Nearest deadline' },
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'alpha', label: 'Alphabetical (A–Z)' },
]

function matchesFilter(task, filter) {
  if (filter === 'all') return true
  if (filter === 'pending') return !task.completed
  if (filter === 'completed') return task.completed
  if (filter === 'overdue') return isOverdue(task)
  if (['high', 'medium', 'low'].includes(filter)) return !task.completed && analyze(task).priority === filter
  return task.category === filter
}

export function AllTasks() {
  const { tasks } = useApp()
  const { openAdd } = useTaskUI()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [filter, setFilter] = useState(params.get('filter') || 'all')
  const [sort, setSort] = useState('priority')
  const [view, setView] = useState(() => localStorage.getItem('smart-todo:view') || 'list')

  useEffect(() => localStorage.setItem('smart-todo:view', view), [view])

  useEffect(() => {
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (filter !== 'all') next.set('filter', filter)
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = tasks.filter(
      (t) =>
        matchesFilter(t, filter) &&
        (!term ||
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term)),
    )

    const sorted = [...list]
    if (sort === 'priority') sorted.sort(comparePriority)
    else if (sort === 'deadline')
      sorted.sort((a, b) => {
        const da = dueDateTime(a)
        const db = dueDateTime(b)
        if (!da && !db) return 0
        if (!da) return 1
        if (!db) return -1
        return da - db
      })
    else if (sort === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    else if (sort === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    else if (sort === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title))
    return sorted
  }, [tasks, query, filter, sort])

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, tasks.filter((t) => matchesFilter(t, f.key)).length])),
    [tasks],
  )

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        eyebrow="Task management"
        title="My Tasks"
        subtitle={`${visible.length} of ${tasks.length} tasks shown`}
        actions={
          <>
            <div className="flex rounded-xl border border-line bg-surface p-0.5" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                title="List view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'list' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Rows3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                title="Grid view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'grid' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button type="button" onClick={openAdd} className="btn btn-primary">
              <Plus size={16} />
              Add Task
            </button>
          </>
        }
      />

      {/* Controls */}
      <div className="card mb-5 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="task-search" className="sr-only">
              Search tasks
            </label>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              id="task-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description or category…"
              className="field !py-2 pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ListFilter size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
            <label htmlFor="sort" className="sr-only">
              Sort tasks
            </label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field !w-auto !py-2">
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="scroll-thin mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`chip shrink-0 px-3 py-1.5 text-[0.76rem] transition ${
                filter === f.key
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm'
                  : 'bg-surface-2 text-ink-2 ring-1 ring-inset ring-line hover:text-ink'
              }`}
            >
              {f.label}
              <span className={filter === f.key ? 'text-white/75' : 'text-ink-3'}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet!"
            message="Start organizing your day by creating your first task. Smart Priority will rank it for you."
            actionLabel="Create First Task"
            onAction={openAdd}
          />
        ) : (
          <EmptyState
            icon={Search}
            tone="medium"
            title="No tasks match your filters"
            message="Try a different keyword, or clear the filter to see everything again."
            actionLabel="Add a task instead"
            onAction={openAdd}
          />
        )
      ) : (
        <div className={view === 'grid' ? 'grid gap-3 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3' : 'space-y-2.5'}>
          {visible.map((task, i) => (
            <div key={task.id} className="animate-rise" style={{ animationDelay: `${Math.min(i * 35, 300)}ms` }}>
              <TaskCard task={task} showScore />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
