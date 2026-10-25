import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, ListChecks, ListFilter, Plus, Rows3, Search, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { TaskCard } from '../components/TaskCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { analyze, sortByPriority } from '../lib/priority.js'
import { daysUntil, dueDateTime, isOverdue } from '../lib/date.js'

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
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'favorite', label: 'Favorites' },
]

const SORTS = [
  { key: 'priority', label: 'Smart priority' },
  { key: 'deadline', label: 'Nearest deadline' },
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'alpha', label: 'Alphabetical (A–Z)' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'effort', label: 'Estimated effort' },
]

function loadSavedViews() {
  try {
    const value = JSON.parse(localStorage.getItem('taskflow:saved-views') || '[]')
    return Array.isArray(value) ? value.filter((view) => view && typeof view.name === 'string' && view.criteria).slice(0, 12) : []
  } catch {
    return []
  }
}

function matchesFilter(task, filter) {
  if (filter === 'all') return true
  if (filter === 'pending') return !task.completed
  if (filter === 'completed') return task.completed
  if (filter === 'overdue') return isOverdue(task)
  if (filter === 'today') return !task.completed && daysUntil(task) === 0
  if (filter === 'week') return !task.completed && daysUntil(task) !== null && daysUntil(task) >= 0 && daysUntil(task) <= 7
  if (filter === 'inbox') return !task.completed && (task.status || 'todo') === 'inbox'
  if (filter === 'in-progress') return !task.completed && task.status === 'in-progress'
  if (filter === 'favorite') return task.favorite
  if (['high', 'medium', 'low', 'urgent'].includes(filter)) return !task.completed && (filter === 'urgent' ? task.priorityMode === 'urgent' : analyze(task).priority === filter)
  return task.category === filter
}

export function AllTasks() {
  const { tasks, settings } = useApp()
  const filters = [...FILTERS, ...(settings.customCategories || []).filter((category) => !FILTERS.some((item) => item.key === category)).map((category) => ({ key: category, label: category }))]
  const { openAdd } = useTaskUI()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [filter, setFilter] = useState(params.get('filter') || 'all')
  const [sort, setSort] = useState(() => localStorage.getItem('taskflow:sort') || 'priority')
  const [view, setView] = useState(() => localStorage.getItem('smart-todo:view') || 'list')
  const [criteria, setCriteria] = useState({ status: '', priority: '', category: '', due: '', tag: '', favorite: false, recurring: false })
  const [savedViews, setSavedViews] = useState(loadSavedViews)
  const [viewName, setViewName] = useState('')
  const [selectedView, setSelectedView] = useState('')

  useEffect(() => localStorage.setItem('smart-todo:view', view), [view])
  useEffect(() => localStorage.setItem('taskflow:sort', sort), [sort])

  useEffect(() => {
    setQuery(params.get('q') || '')
    setFilter(params.get('filter') || 'all')
  }, [params])

  useEffect(() => {
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (filter !== 'all') next.set('filter', filter)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [query, filter, params, setParams])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = tasks.filter(
      (t) =>
        matchesFilter(t, filter) &&
        (!criteria.status || (criteria.status === 'completed' ? t.completed : !t.completed && t.status === criteria.status)) &&
        (!criteria.priority || analyze(t).priority === criteria.priority) &&
        (!criteria.category || t.category === criteria.category) &&
        (!criteria.favorite || t.favorite) &&
        (!criteria.recurring || (t.recurring && t.recurring !== 'none')) &&
        (!criteria.tag || (t.tags || []).some((tag) => tag.toLowerCase() === criteria.tag.trim().replace(/^#/, '').toLowerCase())) &&
        (!criteria.due || (criteria.due === 'none' ? !t.dueDate : criteria.due === 'overdue' ? isOverdue(t) : criteria.due === 'today' ? !t.completed && daysUntil(t) === 0 : !t.completed && daysUntil(t) >= 0 && daysUntil(t) <= 7)) &&
        (!term ||
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(term))),
    )

    let sorted = [...list]
    if (sort === 'priority') sorted = sortByPriority(sorted)
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
    else if (sort === 'updated') sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    else if (sort === 'effort') sorted.sort((a, b) => (a.estimatedMinutes || Infinity) - (b.estimatedMinutes || Infinity))
    return sorted
  }, [tasks, query, filter, sort, criteria])

  const saveCurrentView = () => {
    const name = viewName.trim().slice(0, 40)
    if (!name) return
    const next = [{ name, filter, query, sort, criteria }, ...savedViews.filter((item) => item.name !== name)].slice(0, 12)
    setSavedViews(next)
    localStorage.setItem('taskflow:saved-views', JSON.stringify(next))
    setSelectedView(name)
    setViewName('')
  }

  const applySavedView = (name) => {
    const saved = savedViews.find((item) => item.name === name)
    if (!saved) return
    setFilter(saved.filter || 'all')
    setQuery(saved.query || '')
    setSort(saved.sort || 'priority')
    setCriteria({ status: '', priority: '', category: '', due: '', tag: '', favorite: false, recurring: false, ...saved.criteria })
    setSelectedView(name)
  }

  const removeSavedView = () => {
    const next = savedViews.filter((item) => item.name !== selectedView)
    setSavedViews(next)
    localStorage.setItem('taskflow:saved-views', JSON.stringify(next))
    setSelectedView('')
  }

  const counts = useMemo(
    () => Object.fromEntries([...FILTERS, ...(settings.customCategories || []).filter((category) => !FILTERS.some((item) => item.key === category)).map((category) => ({ key: category }))].map((f) => [f.key, tasks.filter((t) => matchesFilter(t, f.key)).length])),
    [tasks, settings.customCategories],
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
          {filters.map((f) => (
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
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label><span className="sr-only">Filter by status</span><select className="field !py-2" value={criteria.status} onChange={(event) => setCriteria((value) => ({ ...value, status: event.target.value }))}><option value="">Any status</option><option value="inbox">Inbox</option><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
          <label><span className="sr-only">Filter by priority</span><select className="field !py-2" value={criteria.priority} onChange={(event) => setCriteria((value) => ({ ...value, priority: event.target.value }))}><option value="">Any priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">None</option></select></label>
          <label><span className="sr-only">Filter by category</span><select className="field !py-2" value={criteria.category} onChange={(event) => setCriteria((value) => ({ ...value, category: event.target.value }))}><option value="">Any category</option>{filters.filter((item) => item.key !== 'all' && !['high', 'medium', 'low', 'urgent', 'pending', 'completed', 'overdue', 'today', 'week', 'inbox', 'in-progress', 'favorite'].includes(item.key)).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label><span className="sr-only">Filter by deadline</span><select className="field !py-2" value={criteria.due} onChange={(event) => setCriteria((value) => ({ ...value, due: event.target.value }))}><option value="">Any deadline</option><option value="today">Due today</option><option value="week">Due this week</option><option value="overdue">Overdue</option><option value="none">No deadline</option></select></label>
          <label><span className="sr-only">Filter by tag</span><input className="field !py-2" value={criteria.tag} onChange={(event) => setCriteria((value) => ({ ...value, tag: event.target.value }))} placeholder="Exact tag…" /></label>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={criteria.favorite} onClick={() => setCriteria((value) => ({ ...value, favorite: !value.favorite }))} className={`chip px-3 py-1.5 ${criteria.favorite ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-ink-2'}`}>★ Favorites only</button>
          <button type="button" aria-pressed={criteria.recurring} onClick={() => setCriteria((value) => ({ ...value, recurring: !value.recurring }))} className={`chip px-3 py-1.5 ${criteria.recurring ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-ink-2'}`}>↻ Recurring only</button>
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1"><span className="sr-only">Saved task views</span><select className="field !py-2" value={selectedView} onChange={(event) => event.target.value ? applySavedView(event.target.value) : setSelectedView('')}><option value="">Saved views…</option>{savedViews.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
          <button type="button" className="btn btn-ghost shrink-0" disabled={!selectedView} onClick={removeSavedView} aria-label="Delete selected saved view">Delete view</button>
          <label className="min-w-0 flex-1"><span className="sr-only">Name this view</span><input className="field !py-2" value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Name this view" maxLength={40} /></label>
          <button type="button" className="btn btn-ghost shrink-0" disabled={!viewName.trim()} onClick={saveCurrentView}>Save view</button>
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
