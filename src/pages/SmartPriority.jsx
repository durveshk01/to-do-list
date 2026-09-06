import { useMemo, useState } from 'react'
import { BrainCircuit, Check, Info, RefreshCw, Rows3, Sparkles, Table2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { Meter } from '../components/charts/Charts.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { CATEGORY_WEIGHT, analyze, comparePriority } from '../lib/priority.js'
import { formatDateTime, relativeDue, shortDue } from '../lib/date.js'

const SCALE = [
  { label: 'Due today', points: '+50' },
  { label: 'Due tomorrow', points: '+40' },
  { label: 'Within 3 days', points: '+30' },
  { label: 'Within 7 days', points: '+20' },
  { label: 'More than 7 days', points: '+10' },
  { label: 'No deadline', points: '+0' },
]

const BANDS = [
  { key: 'high', label: 'Score 70 – 100', desc: 'Do this first' },
  { key: 'medium', label: 'Score 40 – 69', desc: 'Plan this week' },
  { key: 'low', label: 'Score below 40', desc: 'Keep on the radar' },
]

function ScoreBar({ score, priority }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background:
              priority === 'high'
                ? 'var(--chart-high)'
                : priority === 'medium'
                  ? 'var(--chart-medium)'
                  : 'var(--chart-low)',
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-[0.78rem] font-bold tabular-nums text-ink">{score}/100</span>
    </div>
  )
}

export function SmartPriority() {
  const { tasks, toast } = useApp()
  const { openDetail, openAdd } = useTaskUI()
  const [view, setView] = useState('cards')
  const [nonce, setNonce] = useState(0)
  const [spinning, setSpinning] = useState(false)

  const ranked = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .sort(comparePriority)
        .map((task, index) => ({ task, index, ...analyze(task) })),
    // nonce forces the animation to replay on Recalculate
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, nonce],
  )

  const autoCount = tasks.filter((t) => !t.completed && (!t.priorityMode || t.priorityMode === 'auto')).length

  const recalculate = () => {
    setSpinning(true)
    setNonce((n) => n + 1)
    setTimeout(() => {
      setSpinning(false)
      toast('Priorities recalculated', {
        description: `${autoCount} auto-detected task${autoCount === 1 ? '' : 's'} re-ranked against today's date.`,
      })
    }, 620)
  }

  const bandCounts = ranked.reduce(
    (acc, r) => ({ ...acc, [r.priority]: (acc[r.priority] || 0) + 1 }),
    { high: 0, medium: 0, low: 0 },
  )

  return (
    <div>
      <PageHeader
        icon={BrainCircuit}
        eyebrow="Signature feature"
        title="Smart Priority"
        subtitle="Every task scored out of 100, ranked so the most urgent work sits at the top."
        actions={
          <>
            <div className="flex rounded-xl border border-line bg-surface p-0.5" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setView('cards')}
                aria-pressed={view === 'cards'}
                title="Card view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'cards' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Rows3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
                title="Table view"
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  view === 'table' ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Table2 size={16} />
              </button>
            </div>
            <button type="button" onClick={recalculate} className="btn btn-primary">
              <RefreshCw size={16} className={spinning ? 'animate-spin' : ''} />
              Recalculate Priorities
            </button>
          </>
        }
      />

      {/* How it works */}
      <section className="mb-5 grid gap-4 grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
        <div className="card overflow-hidden">
          <header className="flex items-center gap-2 border-b border-line bg-gradient-to-r from-indigo-500/10 to-violet-500/5 px-4 py-3">
            <Sparkles size={16} className="text-accent" />
            <h2 className="font-display text-[0.95rem] font-bold text-ink">How tasks are ranked</h2>
          </header>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[0.74rem] font-bold uppercase tracking-wide text-ink-3">1. Deadline urgency</p>
              <ul className="space-y-1">
                {SCALE.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-2 text-[0.78rem]">
                    <span className="text-ink-2">{s.label}</span>
                    <span className="font-bold text-ink">{s.points}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[0.74rem] font-bold uppercase tracking-wide text-ink-3">2. Category importance</p>
              <ul className="space-y-1">
                {Object.entries(CATEGORY_WEIGHT).map(([cat, pts]) => (
                  <li key={cat} className="flex items-center justify-between gap-2 text-[0.78rem]">
                    <span className="text-ink-2">{cat}</span>
                    <span className="font-bold text-ink">+{pts}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-2 px-2.5 py-2 text-[0.72rem] text-ink-2">
                <Info size={13} className="mt-0.5 shrink-0 text-accent" />
                Pending tasks get +10, and an active reminder adds +5. Pick a priority manually and it overrides the
                automatic result.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-display text-[0.95rem] font-bold text-ink">3. Priority classification</h2>
          <ul className="mt-3 space-y-2.5">
            {BANDS.map((b) => (
              <li key={b.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <PriorityBadge priority={b.key} full size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8rem] font-semibold text-ink">{b.label}</span>
                  <span className="block text-[0.72rem] text-ink-3">{b.desc}</span>
                </span>
                <span className="font-display text-lg font-extrabold text-ink">{bandCounts[b.key]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.72rem] text-ink-3">
            Within the same band, tasks are ordered by the nearest deadline.
          </p>
        </div>
      </section>

      {/* Ranked list */}
      {ranked.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          tone="done"
          title="Nothing to prioritise"
          message="Every task is completed. Add a new one and it will be scored the moment you save it."
          actionLabel="Create task"
          onAction={openAdd}
        />
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Pending tasks ranked by Smart Priority score</caption>
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[0.72rem] uppercase tracking-wide text-ink-3">
                  <th scope="col" className="px-4 py-3 font-bold">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Task
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Deadline
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Urgency score
                  </th>
                  <th scope="col" className="px-4 py-3 font-bold">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ task, score, priority, index }) => (
                  <tr
                    key={task.id}
                    onClick={() => openDetail(task)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openDetail(task)
                    }}
                    className="animate-rise cursor-pointer border-b border-line transition last:border-0 hover:bg-surface-2"
                    style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                  >
                    <td className="px-4 py-3 text-[0.8rem] font-bold text-ink-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-[0.85rem] font-bold text-ink">{task.title}</p>
                      <p className="mt-0.5 line-clamp-1 max-w-xs text-[0.72rem] text-ink-3">
                        {task.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[0.8rem] font-semibold text-ink-2">{shortDue(task)}</p>
                      <p className="text-[0.7rem] text-ink-3">{formatDateTime(task)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip bg-surface-3 text-ink-2">{task.category}</span>
                    </td>
                    <td className="w-48 px-4 py-3">
                      <ScoreBar score={score} priority={priority} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={priority} full />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ task, score, priority, factors, manual, autoPriority, index }) => (
            <article
              key={task.id}
              className="card card-hover animate-rise cursor-pointer overflow-hidden"
              style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(task)
                }
              }}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-[0.95rem] font-extrabold text-white"
                  style={{
                    background:
                      priority === 'high'
                        ? 'linear-gradient(135deg,#f97316,#ef4444)'
                        : priority === 'medium'
                          ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                          : 'linear-gradient(135deg,#60a5fa,#3b82f6)',
                  }}
                  aria-hidden="true"
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-[1.02rem] font-bold leading-snug text-ink">{task.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.76rem] text-ink-2">
                        <span className="chip bg-surface-3 text-ink-2">{task.category}</span>
                        <span className="font-semibold">{relativeDue(task)}</span>
                        <span className="text-ink-3">{formatDateTime(task)}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <PriorityBadge priority={priority} full size="md" />
                      <span className="font-display text-[1.35rem] font-extrabold leading-none text-ink">
                        {score}
                        <span className="text-[0.8rem] font-bold text-ink-3"> / 100</span>
                      </span>
                    </div>
                  </div>

                  <Meter
                    value={score}
                    color={
                      priority === 'high'
                        ? 'var(--chart-high)'
                        : priority === 'medium'
                          ? 'var(--chart-medium)'
                          : 'var(--chart-low)'
                    }
                    className="mt-3"
                  />

                  <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
                    <p className="text-[0.72rem] font-bold uppercase tracking-wide text-ink-3">Why?</p>
                    <ul className="mt-1.5 grid gap-1 grid-cols-1 sm:grid-cols-2">
                      {factors
                        .filter((f) => f.points > 0)
                        .map((f, i) => (
                          <li key={`${f.label}-${i}`} className="flex items-center gap-1.5 text-[0.78rem] text-ink-2">
                            <Check size={12} strokeWidth={3} className="shrink-0 text-done" aria-hidden="true" />
                            <span className="flex-1">{f.label}</span>
                            <span className="font-semibold text-ink">+{f.points}</span>
                          </li>
                        ))}
                    </ul>
                    {manual && (
                      <p className="mt-2 text-[0.72rem] text-ink-3">
                        Manual override — auto detection ranked this {autoPriority}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
