import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CheckCircle2, Flame, ListChecks, Target, TrendingUp } from 'lucide-react'
import { PageHeader, SectionHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { CHART_COLORS, CountUp, Meter, PriorityDonut, ProgressRing, WeeklyBars } from '../components/charts/Charts.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { categoryBreakdown, priorityBreakdown, productivityScore, weeklyCompletion } from '../lib/analytics.js'

function MiniStat({ label, value, tone = 'accent', icon: Icon, hint }) {
  const tones = {
    accent: 'text-accent bg-accent-soft',
    done: 'text-done bg-done/10',
    medium: 'text-medium bg-medium/10',
    high: 'text-high bg-high/10',
  }
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-2 font-display text-[1.65rem] font-extrabold leading-none text-ink">
        <CountUp value={value} />
      </p>
      {hint && <p className="mt-1 text-[0.72rem] text-ink-2">{hint}</p>}
    </div>
  )
}

export function Analytics() {
  const { tasks, stats } = useApp()
  const { openAdd } = useTaskUI()
  const navigate = useNavigate()

  const score = useMemo(() => productivityScore(tasks, stats), [tasks, stats])
  const weekly = useMemo(() => weeklyCompletion(tasks), [tasks])
  const categories = useMemo(() => categoryBreakdown(tasks), [tasks])
  const allPriority = useMemo(() => priorityBreakdown(tasks), [tasks])
  const weekTotal = weekly.reduce((s, d) => s + d.value, 0)
  const bestDay = weekly.reduce((best, d) => (d.value > best.value ? d : best), weekly[0])

  const pendingDonut = [
    { key: 'high', label: 'High priority', value: stats.byPriority.high, color: CHART_COLORS.high },
    { key: 'medium', label: 'Medium priority', value: stats.byPriority.medium, color: CHART_COLORS.medium },
    { key: 'low', label: 'Low priority', value: stats.byPriority.low, color: CHART_COLORS.low },
  ]

  if (tasks.length === 0) {
    return (
      <div>
        <PageHeader icon={BarChart3} eyebrow="Insights" title="Task Analytics" subtitle="Your productivity at a glance." />
        <EmptyState
          icon={BarChart3}
          title="No data to analyse yet"
          message="Add a few tasks and complete them — your charts will fill in automatically."
          actionLabel="Create First Task"
          onAction={openAdd}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        eyebrow="Insights"
        title="Task Analytics"
        subtitle="How your workload is split, and how much of it you're clearing."
        actions={
          <>
            <button type="button" onClick={() => navigate('/tasks?filter=pending')} className="btn btn-ghost">
              <ListChecks size={16} />
              View Pending
            </button>
            <button type="button" onClick={() => navigate('/completed')} className="btn btn-primary">
              <CheckCircle2 size={16} />
              View Completed
            </button>
          </>
        }
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.25fr]">
        {/* My progress */}
        <section className="card p-5">
          <SectionHeader title="My progress" subtitle="Completion across every task you've added" icon={Target} />
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <ProgressRing value={stats.percent} size={168} sublabel={`${stats.completed}/${stats.total} tasks`} />
            <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-1">
              <MiniStat label="Total tasks" value={stats.total} icon={ListChecks} hint="Everything you've created" />
              <MiniStat
                label="Completed"
                value={stats.completed}
                tone="done"
                icon={CheckCircle2}
                hint={`${stats.percent}% completion rate`}
              />
              <MiniStat
                label="Pending"
                value={stats.pending}
                tone="medium"
                icon={TrendingUp}
                hint={stats.dueToday.length ? `${stats.dueToday.length} due today` : 'Nothing due today'}
              />
              <MiniStat
                label="Overdue"
                value={stats.overdue.length}
                tone="high"
                icon={Flame}
                hint={stats.overdue.length ? 'Clear these first' : 'All deadlines respected'}
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-accent/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[0.74rem] font-bold uppercase tracking-wide text-ink-3">Productivity score</p>
                <p className="mt-1 text-[0.76rem] text-ink-2">
                  Completion rate, weekly momentum and overdue tasks combined.
                </p>
              </div>
              <p className="font-display text-3xl font-extrabold leading-none text-ink">
                <CountUp value={score} />
              </p>
            </div>
            <Meter value={score} color="var(--color-accent)" className="mt-3 !h-2" />
          </div>
        </section>

        {/* Charts */}
        <div className="space-y-5">
          <section className="card p-5">
            <SectionHeader
              title="Weekly productivity"
              subtitle={`${weekTotal} completed this week${bestDay?.value ? ` • best day ${bestDay.full}` : ''}`}
              icon={TrendingUp}
            />
            <WeeklyBars data={weekly} height={150} />
          </section>

          <section className="card p-5">
            <SectionHeader title="By priority" subtitle="Your pending workload right now" icon={Flame} />
            {stats.pending === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                tone="done"
                title="Nothing pending"
                message="Every task is complete — there's no priority queue to show."
              />
            ) : (
              <PriorityDonut data={pendingDonut} />
            )}
          </section>
        </div>
      </div>

      {/* Category + all-time priority */}
      <div className="mt-5 grid gap-5 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <SectionHeader title="By category" subtitle="Where your time actually goes" icon={BarChart3} />
          <ul className="space-y-3.5">
            {categories.map((row) => (
              <li key={row.category}>
                <div className="flex items-center justify-between gap-2 text-[0.82rem]">
                  <span className="font-semibold text-ink">{row.category}</span>
                  <span className="text-ink-2">
                    <span className="font-bold text-done">{row.completed}</span>
                    <span className="text-ink-3"> done</span>
                    <span className="mx-1.5 text-line-strong">•</span>
                    <span className="font-bold text-medium">{row.pending}</span>
                    <span className="text-ink-3"> pending</span>
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="rounded-l-full transition-all duration-700"
                    style={{ width: `${(row.completed / row.total) * 100}%`, background: 'var(--chart-done)' }}
                  />
                  <div
                    className="transition-all duration-700"
                    style={{ width: `${(row.pending / row.total) * 100}%`, background: 'var(--chart-medium)' }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <SectionHeader title="All-time priority mix" subtitle="Including tasks you've already completed" />
          <ul className="space-y-2.5">
            {['high', 'medium', 'low'].map((key) => (
              <li key={key} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <PriorityBadge priority={key} full size="md" />
                <div className="min-w-0 flex-1">
                  <Meter
                    value={allPriority[key]}
                    max={Math.max(tasks.length, 1)}
                    color={CHART_COLORS[key]}
                    className="!h-2"
                  />
                </div>
                <span className="font-display text-lg font-extrabold text-ink">{allPriority[key]}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => navigate('/tasks?filter=high')} className="btn btn-ghost !text-[0.78rem]">
              High priority tasks
            </button>
            <button type="button" onClick={() => navigate('/tasks?filter=overdue')} className="btn btn-ghost !text-[0.78rem]">
              Overdue tasks
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
