import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, ListOrdered, Plus } from 'lucide-react'
import { PageHeader, SectionHeader } from '../components/PageHeader.jsx'
import { PriorityBadge, PriorityDot } from '../components/PriorityBadge.jsx'
import { DeadlineTimeline } from '../components/DeadlineTimeline.jsx'
import { TaskCard } from '../components/TaskCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { analyze } from '../lib/priority.js'
import { dueDateTime, formatDate, formatTime, isOverdue, monthGrid, monthName, toKey, weekdayShort } from '../lib/date.js'

const DOW = [1, 2, 3, 4, 5, 6, 0]

export function CalendarPage() {
  const { tasks } = useApp()
  const { openDetail, openAdd } = useTaskUI()
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(toKey())
  const [view, setView] = useState('month')

  const byDate = useMemo(() => {
    const map = new Map()
    tasks.forEach((t) => {
      if (!t.dueDate) return
      const list = map.get(t.dueDate) || []
      list.push(t)
      map.set(t.dueDate, list)
    })
    map.forEach((list) => list.sort((a, b) => dueDateTime(a) - dueDateTime(b)))
    return map
  }, [tasks])

  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])
  const selectedTasks = byDate.get(selected) || []

  const shift = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const goToday = () => {
    setCursor({ year: today.getFullYear(), month: today.getMonth() })
    setSelected(toKey())
  }

  const monthTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (!t.dueDate) return false
          const [y, m] = t.dueDate.split('-').map(Number)
          return y === cursor.year && m - 1 === cursor.month
        })
        .sort((a, b) => dueDateTime(a) - dueDateTime(b)),
    [tasks, cursor],
  )

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        eyebrow="Deadlines"
        title="Calendar & Deadlines"
        subtitle="See every deadline in context — click a task to open its details."
        actions={
          <>
            <div className="flex rounded-xl border border-line bg-surface p-0.5" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setView('month')}
                aria-pressed={view === 'month'}
                title="Month view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'month' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                title="List view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'list' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <ListOrdered size={16} />
              </button>
            </div>
            <button type="button" onClick={openAdd} className="btn btn-primary">
              <Plus size={16} />
              Add Task
            </button>
          </>
        }
      />

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {view === 'month' ? (
            <section className="card p-4 sm:p-5">
              <header className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-[1.05rem] font-bold text-ink">
                  {monthName(cursor.month)} {cursor.year}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={goToday} className="btn btn-ghost !px-2.5 !py-1.5 !text-[0.76rem]">
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => shift(-1)}
                    aria-label="Previous month"
                    className="rounded-lg border border-line bg-surface p-1.5 text-ink-2 transition hover:text-ink"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="Next month"
                    className="rounded-lg border border-line bg-surface p-1.5 text-ink-2 transition hover:text-ink"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {DOW.map((d) => (
                  <div key={d} className="pb-1 text-center text-[0.68rem] font-bold uppercase tracking-wide text-ink-3">
                    {weekdayShort(d).slice(0, 2)}
                  </div>
                ))}

                {grid.map((cell) => {
                  const items = byDate.get(cell.key) || []
                  const pending = items.filter((t) => !t.completed)
                  const hasOverdue = pending.some(isOverdue)
                  const top = pending.slice(0, 2)
                  const isSelected = cell.key === selected
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelected(cell.key)}
                      aria-pressed={isSelected}
                      aria-label={`${formatDate(cell.key)}, ${items.length} task${items.length === 1 ? '' : 's'}`}
                      className={`min-h-[4.1rem] rounded-xl border p-1.5 text-left transition sm:min-h-[5.4rem] ${
                        isSelected
                          ? 'border-accent bg-accent-soft ring-1 ring-accent/40'
                          : cell.isToday
                            ? 'border-accent/40 bg-accent-soft/50'
                            : 'border-line bg-surface-2 hover:border-line-strong'
                      } ${cell.inMonth ? '' : 'opacity-45'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full text-[0.7rem] font-bold ${
                            cell.isToday ? 'bg-accent text-white' : 'text-ink-2'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {hasOverdue && <span className="h-1.5 w-1.5 rounded-full bg-high" aria-hidden="true" />}
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {top.map((t) => (
                          <span
                            key={t.id}
                            className="flex items-center gap-1 truncate text-[0.63rem] font-semibold text-ink-2"
                          >
                            <PriorityDot priority={analyze(t).priority} className="!h-1.5 !w-1.5" />
                            <span className="truncate">{t.title}</span>
                          </span>
                        ))}
                        {pending.length > 2 && (
                          <span className="block text-[0.62rem] font-semibold text-accent">
                            +{pending.length - 2} more
                          </span>
                        )}
                        {pending.length === 0 && items.length > 0 && (
                          <span className="block truncate text-[0.62rem] text-done">✓ {items.length} done</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[0.72rem] text-ink-2">
                <span className="font-semibold text-ink-3">Priority colours:</span>
                <PriorityBadge priority="high" />
                <PriorityBadge priority="medium" />
                <PriorityBadge priority="low" />
              </div>
            </section>
          ) : (
            <section className="card p-4 sm:p-5">
              <SectionHeader
                title={`${monthName(cursor.month)} ${cursor.year}`}
                subtitle={`${monthTasks.length} task${monthTasks.length === 1 ? '' : 's'} scheduled this month`}
                action={
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => shift(-1)}
                      aria-label="Previous month"
                      className="rounded-lg border border-line bg-surface p-1.5 text-ink-2 transition hover:text-ink"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shift(1)}
                      aria-label="Next month"
                      className="rounded-lg border border-line bg-surface p-1.5 text-ink-2 transition hover:text-ink"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                }
              />
              {monthTasks.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title="Nothing scheduled this month"
                  message="Add a task with a deadline in this month and it will show up here."
                  actionLabel="Add task"
                  onAction={openAdd}
                />
              ) : (
                <div className="space-y-2.5">
                  {monthTasks.map((t) => (
                    <TaskCard key={t.id} task={t} compact />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Selected day */}
          <section className="card p-4 sm:p-5">
            <SectionHeader
              title={formatDate(selected)}
              subtitle={
                selectedTasks.length
                  ? `${selectedTasks.length} task${selectedTasks.length === 1 ? '' : 's'} on this day`
                  : 'Nothing scheduled'
              }
            />
            {selectedTasks.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarDays}
                title="No deadlines on this day"
                message="Pick another date, or create a task with this deadline."
                actionLabel="Add task"
                onAction={openAdd}
              />
            ) : (
              <ul className="space-y-2">
                {selectedTasks.map((t) => {
                  const priority = analyze(t).priority
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(t)}
                        className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left transition hover:border-line-strong hover:-translate-y-px"
                      >
                        <PriorityDot priority={t.completed ? 'completed' : priority} />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[0.86rem] font-semibold text-ink ${
                              t.completed ? 'line-through decoration-done/60' : ''
                            }`}
                          >
                            {t.title}
                          </span>
                          <span className="block text-[0.72rem] text-ink-3">
                            {t.category}
                            {t.dueTime ? ` • ${formatTime(t.dueTime)}` : ''}
                          </span>
                        </span>
                        <PriorityBadge priority={t.completed ? 'completed' : priority} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="card h-fit p-4 sm:p-5 xl:sticky xl:top-24">
          <SectionHeader title="Upcoming deadlines" subtitle="Overdue first, then by how soon they land" />
          <DeadlineTimeline tasks={tasks} />
        </section>
      </div>
    </div>
  )
}
