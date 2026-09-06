import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  ListChecks,
  Plus,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { SectionHeader } from '../components/PageHeader.jsx'
import { SmartFocusCard } from '../components/SmartFocusCard.jsx'
import { TaskCard } from '../components/TaskCard.jsx'
import { DeadlineTimeline } from '../components/DeadlineTimeline.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { CountUp, Meter, PriorityDonut, ProgressRing, WeeklyBars, CHART_COLORS } from '../components/charts/Charts.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { comparePriority, focusTask } from '../lib/priority.js'
import { daysUntil, greeting, isOverdue, longToday } from '../lib/date.js'
import { motivationalMessage, productivityScore, weeklyCompletion } from '../lib/analytics.js'

function StatCard({ icon: Icon, label, value, hint, tone = 'accent', meter, max, delay = 0 }) {
  const tones = {
    accent: 'from-indigo-500/15 to-violet-500/10 text-accent',
    done: 'from-emerald-500/15 to-teal-500/10 text-done',
    medium: 'from-amber-500/15 to-orange-500/10 text-medium',
    high: 'from-rose-500/15 to-red-500/10 text-high',
  }
  const meterColors = {
    accent: 'var(--chart-low)',
    done: 'var(--chart-done)',
    medium: 'var(--chart-medium)',
    high: 'var(--chart-high)',
  }
  return (
    <article className="card card-hover animate-rise p-4 sm:p-[1.15rem]" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
          <p className="mt-1.5 font-display text-[1.9rem] font-extrabold leading-none text-ink">
            <CountUp value={value} />
          </p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      {meter !== undefined && <Meter value={meter} max={max} color={meterColors[tone]} className="mt-3.5" />}
      <p className="mt-2 text-[0.74rem] text-ink-2">{hint}</p>
    </article>
  )
}

export function Dashboard() {
  const { tasks, stats, user } = useApp()
  const { openAdd } = useTaskUI()

  const focus = useMemo(() => focusTask(tasks), [tasks])
  const score = useMemo(() => productivityScore(tasks, stats), [tasks, stats])
  const weekly = useMemo(() => weeklyCompletion(tasks), [tasks])
  const weekTotal = weekly.reduce((s, d) => s + d.value, 0)

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .sort(comparePriority)
        .slice(0, 5),
    [tasks],
  )

  const donutData = [
    { key: 'high', label: 'High priority', value: stats.byPriority.high, color: CHART_COLORS.high },
    { key: 'medium', label: 'Medium priority', value: stats.byPriority.medium, color: CHART_COLORS.medium },
    { key: 'low', label: 'Low priority', value: stats.byPriority.low, color: CHART_COLORS.low },
  ]

  const attention = stats.overdue.length + stats.dueToday.length || stats.byPriority.high

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl2 border border-line bg-[#101a3a] p-5 text-white shadow-xl shadow-slate-900/10 sm:p-7">
        <div className="mesh absolute inset-0 opacity-80" aria-hidden="true" />
        <div className="grid-lines absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101a3a] via-[#101a3a]/70 to-transparent" aria-hidden="true" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-white/60">{longToday()}</p>
            <h1 className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight sm:text-[2rem]">
              {greeting()}, {(user?.name || 'Student').split(' ')[0]} 👋
            </h1>
            <p className="mt-2 max-w-xl text-[0.92rem] text-white/75">
              {attention > 0 ? (
                <>
                  You have{' '}
                  <strong className="font-bold text-white">
                    {attention} important task{attention === 1 ? '' : 's'}
                  </strong>{' '}
                  {attention === 1 ? 'that needs' : 'that need'} your attention today.
                </>
              ) : (
                <>No urgent deadlines today. A great moment to get ahead of next week.</>
              )}
            </p>
            <p className="mt-1.5 max-w-xl text-[0.84rem] text-white/55">{motivationalMessage(stats, score)}</p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" onClick={openAdd} className="btn bg-white text-indigo-700 hover:bg-white/90">
                <Plus size={17} />
                Add New Task
              </button>
              <Link to="/priority" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                Smart Priority
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-sm sm:flex-row lg:flex-col lg:w-[17rem]">
            <div className="flex-1">
              <div className="flex items-end justify-between">
                <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-white/65">Productivity score</p>
                <p className="font-display text-2xl font-extrabold leading-none">
                  <CountUp value={score} />
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <div className="hidden w-px bg-white/15 sm:block lg:hidden" aria-hidden="true" />
            <div className="flex-1">
              <div className="flex items-end justify-between">
                <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-white/65">Today's progress</p>
                <p className="font-display text-2xl font-extrabold leading-none">
                  <CountUp value={stats.percent} suffix="%" />
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-200 transition-all duration-1000"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[0.72rem] text-white/55">
                {stats.completed} of {stats.total} tasks completed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Total tasks"
          value={stats.total}
          hint={`${stats.pending} still to do`}
          tone="accent"
          meter={stats.total}
          max={Math.max(stats.total, 1)}
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          hint={`${stats.percent}% of everything you added`}
          tone="done"
          meter={stats.completed}
          max={Math.max(stats.total, 1)}
          delay={60}
        />
        <StatCard
          icon={Timer}
          label="Pending"
          value={stats.pending}
          hint={stats.dueToday.length ? `${stats.dueToday.length} due today` : 'Nothing due today'}
          tone="medium"
          meter={stats.pending}
          max={Math.max(stats.total, 1)}
          delay={120}
        />
        <StatCard
          icon={Flame}
          label="High priority"
          value={stats.byPriority.high}
          hint={stats.overdue.length ? `${stats.overdue.length} overdue • act now` : 'Detected automatically'}
          tone="high"
          meter={stats.byPriority.high}
          max={Math.max(stats.pending, 1)}
          delay={180}
        />
      </section>

      {/* Focus + today */}
      <div className="grid gap-5 grid-cols-1 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <SmartFocusCard task={focus} />

          <section className="card p-4 sm:p-5">
            <SectionHeader
              title="Today's tasks"
              subtitle="Ranked by Smart Priority, most important first"
              icon={ListChecks}
              action={
                <Link to="/tasks" className="text-[0.78rem] font-semibold text-accent hover:underline">
                  View all
                </Link>
              }
            />
            {todayTasks.length === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                tone="done"
                title="No pending tasks!"
                message="You've cleared your list. Add a new task to keep the momentum going."
                actionLabel="Create task"
                onAction={openAdd}
              />
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} showScore />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Deadlines */}
        <section className="card h-fit p-4 sm:p-5">
          <SectionHeader
            title="Upcoming deadlines"
            subtitle="Grouped by how soon they land"
            icon={CalendarClock}
            action={
              <Link to="/calendar" className="text-[0.78rem] font-semibold text-accent hover:underline">
                Calendar
              </Link>
            }
          />
          {stats.overdue.length > 0 && (
            <p className="mb-3.5 flex items-center gap-2 rounded-xl border border-high/25 bg-high/[0.08] px-3 py-2 text-[0.78rem] font-semibold text-high">
              <AlertTriangle size={15} />
              {stats.overdue.length} task{stats.overdue.length === 1 ? '' : 's'} past the deadline
            </p>
          )}
          <DeadlineTimeline tasks={tasks} limit={4} />
        </section>
      </div>

      {/* Progress & analytics */}
      <section className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-5 text-center">
          <SectionHeader title="Overall progress" subtitle="Completed vs. everything you added" icon={TrendingUp} />
          <ProgressRing value={stats.percent} sublabel={`${stats.completed}/${stats.total} tasks`} />
          <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="font-display text-lg font-extrabold text-done">{stats.completed}</p>
              <p className="text-[0.72rem] text-ink-2">Completed</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="font-display text-lg font-extrabold text-medium">{stats.pending}</p>
              <p className="text-[0.72rem] text-ink-2">Pending</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <SectionHeader
            title="Weekly productivity"
            subtitle={`${weekTotal} task${weekTotal === 1 ? '' : 's'} completed this week`}
            icon={TrendingUp}
          />
          <WeeklyBars data={weekly} />
        </div>

        <div className="card p-5">
          <SectionHeader title="Priority distribution" subtitle="Your pending workload right now" icon={Flame} />
          {stats.pending === 0 ? (
            <EmptyState
              compact
              icon={CheckCircle2}
              tone="done"
              title="Nothing pending"
              message="Your priority queue is empty — enjoy it while it lasts."
            />
          ) : (
            <PriorityDonut data={donutData} />
          )}
        </div>
      </section>
    </div>
  )
}
