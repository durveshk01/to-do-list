import { useMemo, useState } from 'react'
import { CheckCheck, PartyPopper, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { CountUp, Meter } from '../components/charts/Charts.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { CATEGORIES, analyze } from '../lib/priority.js'
import { formatDateTime, humanStamp, weekKeys, toKey } from '../lib/date.js'

const SORTS = [
  { key: 'recent', label: 'Recently completed' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'alpha', label: 'Alphabetical (A–Z)' },
  { key: 'priority', label: 'Original priority' },
]

export function Completed() {
  const { tasks, stats } = useApp()
  const { openDetail, reopen, askDelete, openAdd } = useTaskUI()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')

  const week = new Set(weekKeys())
  const thisWeek = stats.completedList.filter((t) => t.completedAt && week.has(toKey(new Date(t.completedAt)))).length
  const todayCount = stats.completedList.filter(
    (t) => t.completedAt && toKey(new Date(t.completedAt)) === toKey(),
  ).length

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const list = stats.completedList.filter(
      (t) =>
        (category === 'all' || t.category === category) &&
        (!term || t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)),
    )
    const rank = { high: 0, medium: 1, low: 2 }
    const sorted = [...list]
    if (sort === 'recent') sorted.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
    else if (sort === 'oldest') sorted.sort((a, b) => new Date(a.completedAt || 0) - new Date(b.completedAt || 0))
    else if (sort === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else sorted.sort((a, b) => rank[analyze(a).priority] - rank[analyze(b).priority])
    return sorted
  }, [stats.completedList, query, category, sort])

  return (
    <div>
      <PageHeader
        icon={CheckCheck}
        eyebrow="Archive"
        title="Completed Tasks"
        subtitle="Everything you've finished, with the date you finished it."
      />

      {/* Celebration banner */}
      <section className="relative mb-5 overflow-hidden rounded-xl2 border border-emerald-500/25 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20 sm:p-6">
        <div className="grid-lines absolute inset-0 opacity-15" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[0.74rem] font-bold uppercase tracking-[0.12em] text-white/85">
              <PartyPopper size={15} />
              Progress
            </p>
            <h2 className="mt-2 font-display text-[1.5rem] font-extrabold leading-tight sm:text-[1.85rem]">
              🎉 You completed <CountUp value={stats.completed} /> task{stats.completed === 1 ? '' : 's'}!
            </h2>
            <p className="mt-1.5 text-[0.88rem] text-white/80">
              {todayCount > 0
                ? `${todayCount} of them today. That's real momentum.`
                : thisWeek > 0
                  ? `${thisWeek} finished this week. Keep it going.`
                  : 'Finish one more and your streak restarts.'}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:w-56">
            <div className="flex items-end justify-between">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-white/70">Completion rate</p>
              <p className="font-display text-2xl font-extrabold leading-none">
                <CountUp value={stats.percent} suffix="%" />
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all duration-1000"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <p className="mt-2 text-[0.72rem] text-white/70">
              {stats.completed} of {stats.total} tasks • {thisWeek} this week
            </p>
          </div>
        </div>
      </section>

      {stats.completedList.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          tone="done"
          title="No completed tasks yet"
          message="Complete your first task and celebrate your progress! It will appear here with the exact time you finished it."
          actionLabel="Add a task"
          onAction={openAdd}
        />
      ) : (
        <>
          <div className="card mb-5 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:p-4">
            <div className="relative flex-1">
              <label htmlFor="done-search" className="sr-only">
                Search completed tasks
              </label>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                id="done-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search completed tasks…"
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
            <div className="flex gap-2">
              <label htmlFor="done-category" className="sr-only">
                Filter by category
              </label>
              <select
                id="done-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field !py-2"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label htmlFor="done-sort" className="sr-only">
                Sort completed tasks
              </label>
              <select id="done-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field !py-2">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon={Search}
              tone="medium"
              title="Nothing matches that search"
              message="Try another keyword or switch the category filter back to all."
            />
          ) : (
            <div className="space-y-2.5">
              {visible.map((task, i) => (
                <article
                  key={task.id}
                  className="card card-hover animate-rise flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  style={{ animationDelay: `${Math.min(i * 35, 300)}ms` }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-done/12 text-done">
                    <CheckCheck size={18} />
                  </span>

                  <button
                    type="button"
                    onClick={() => openDetail(task)}
                    className="min-w-0 flex-1 text-left"
                    aria-label={`View details for ${task.title}`}
                  >
                    <h3 className="truncate font-display text-[0.95rem] font-bold text-ink line-through decoration-done/50 decoration-2">
                      {task.title}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.74rem] text-ink-2">
                      <span className="chip bg-surface-3 text-ink-2">{task.category}</span>
                      <span className="font-semibold text-done">Completed {humanStamp(task.completedAt)}</span>
                      <span className="text-ink-3">Deadline was {formatDateTime(task)}</span>
                    </p>
                    <Meter value={100} color="var(--chart-done)" className="mt-2 max-w-40" />
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={analyze(task).priority} />
                    <button
                      type="button"
                      onClick={() => reopen(task)}
                      className="btn btn-ghost !px-2.5 !py-1.5 !text-[0.76rem]"
                    >
                      <RotateCcw size={14} />
                      Reopen
                    </button>
                    <button
                      type="button"
                      onClick={() => askDelete(task)}
                      aria-label={`Delete ${task.title}`}
                      className="rounded-lg p-2 text-ink-3 transition hover:bg-high/10 hover:text-high"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
