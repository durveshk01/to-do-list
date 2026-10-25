import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BadgeCheck, CalendarDays, CheckCircle2, Flame, ListChecks, Target, Timer, TrendingUp, Trophy } from 'lucide-react'
import { PageHeader, SectionHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { CHART_COLORS, CountUp, Meter, PriorityDonut, ProgressRing, WeeklyBars } from '../components/charts/Charts.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { activityHeatmap, categoryBreakdown, completionInsights, completionRange, priorityBreakdown, productivityScore, streakSummary, weeklyCompletion } from '../lib/analytics.js'

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

function Insight({ label, value }) {
  return <div className="rounded-xl border border-line bg-surface-2 p-3.5"><p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-3">{label}</p><p className="mt-1 font-display text-lg font-bold text-ink">{value}</p></div>
}

export function Analytics() {
  const { tasks, stats, focusSessions, settings } = useApp()
  const { openAdd } = useTaskUI()
  const navigate = useNavigate()
  const [range, setRange] = useState('7')

  const score = useMemo(() => productivityScore(tasks, stats), [tasks, stats])
  const weekly = useMemo(() => weeklyCompletion(tasks, settings.weekStartsMonday), [tasks, settings.weekStartsMonday])
  const categories = useMemo(() => categoryBreakdown(tasks), [tasks])
  const allPriority = useMemo(() => priorityBreakdown(tasks), [tasks])
  const weekTotal = weekly.reduce((s, d) => s + d.value, 0)
  const bestDay = weekly.reduce((best, d) => (d.value > best.value ? d : best), weekly[0])
  const streak = useMemo(() => streakSummary(tasks), [tasks])
  const insights = useMemo(() => completionInsights(tasks, focusSessions), [tasks, focusSessions])
  const heatmap = useMemo(() => activityHeatmap(tasks), [tasks])
  const focusStreak = useMemo(() => streakSummary(focusSessions.map((session) => ({ completedAt: session.createdAt }))), [focusSessions])
  const rangeCompletions = useMemo(() => range === 'all' ? tasks.filter((task) => task.completedAt) : completionRange(tasks, Number(range)), [tasks, range])
  const achievementCount = [stats.completed >= 1, stats.completed >= 10, stats.completed >= 50, stats.completed >= 100, streak.longest >= 7, streak.longest >= 30].filter(Boolean).length

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
            <label htmlFor="analytics-range" className="sr-only">Analytics date range</label><select id="analytics-range" className="field !w-auto !py-2" value={range} onChange={(event) => setRange(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select>
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Daily streak" value={streak.current} tone="medium" icon={Flame} hint={`Longest: ${streak.longest} days`} />
        <MiniStat label="Completed in range" value={rangeCompletions.length} icon={CheckCircle2} hint={`${rangeCompletions.length} of ${stats.total} total tasks finished`} />
        <MiniStat label="Focus time" value={insights.focusMinutes} tone="done" icon={Timer} hint={`${insights.focusCount} sessions recorded`} />
        <MiniStat label="Focus streak" value={focusStreak.current} tone="medium" icon={Target} hint={`Longest: ${focusStreak.longest} days`} />
        <MiniStat label="Achievements" value={achievementCount} tone="accent" icon={Trophy} hint="Earned from real task activity" />
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_1.25fr]">
        
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

      <section className="card mt-5 p-5">
        <SectionHeader title="Productivity insights" subtitle="Calculated from your completed tasks and saved focus sessions" icon={BadgeCheck} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Insight label="Most productive day" value={insights.bestDay || 'Not enough data'} />
          <Insight label="Most productive time" value={insights.bestHour || 'Not enough data'} />
          <Insight label="Average focus session" value={insights.focusCount ? `${insights.averageFocusMinutes} min` : 'No sessions yet'} />
          <Insight label="Completion rate" value={`${stats.percent}%`} />
          <Insight label="Average tracked task time" value={insights.averageCompletionMinutes ? `${insights.averageCompletionMinutes} min` : 'Not tracked yet'} />
        </div>
        <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink"><CalendarDays size={16} className="text-accent"/>Productivity heatmap</h3><p className="mt-1 text-xs text-ink-3">Task completions over the last 13 weeks. Focus a day for its activity summary.</p></div><div className="flex items-center gap-2 text-[0.68rem] text-ink-3"><span>Less</span>{[0,1,2,3,4].map((level) => <span key={level} aria-hidden="true" className="h-3 w-3 rounded-[3px]" style={{ background: level ? `color-mix(in srgb, var(--chart-done) ${level * 22}%, var(--color-surface-3))` : 'var(--color-surface-3)' }} />)}<span>More</span></div></div>
          <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1" role="list" aria-label="Daily task completions and creations for the past 13 weeks">{heatmap.map((day) => { const level = Math.min(4, day.completed); return <span key={day.key} role="listitem" tabIndex={0} aria-label={`${day.key}: ${day.completed} completed, ${day.created} created`} title={`${day.key}: ${day.completed} completed, ${day.created} created`} className="h-3.5 w-3.5 rounded-[3px] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" style={{ background: level ? `color-mix(in srgb, var(--chart-done) ${level * 22}%, var(--color-surface-3))` : 'var(--color-surface-3)' }} />})}</div>
          <p className="mt-2 text-[0.7rem] text-ink-3">Each day includes both completed and created task counts.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{[
          ['First task', stats.completed >= 1],
          ['10 completed', stats.completed >= 10],
          ['50 completed', stats.completed >= 50],
          ['100 completed', stats.completed >= 100],
          ['7-day streak', streak.longest >= 7],
          ['30-day streak', streak.longest >= 30],
        ].map(([name, earned]) => <span key={name} className={`chip px-3 py-1.5 ${earned ? 'bg-done/10 text-done' : 'bg-surface-2 text-ink-3'}`} aria-label={`${name}: ${earned ? 'earned' : 'locked'}`}>{earned ? '✓' : '○'} {name}</span>)}</div>
      </section>
    </div>
  )
}
