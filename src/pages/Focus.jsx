import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CirclePause, CirclePlay, Clock3, Focus as FocusIcon, Pause, Play, RotateCcw, SkipForward, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'

const TIMER_KEY = 'taskflow:focus-timer'
const PRESETS = [25, 50, 90]

function loadTimer() {
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY) || 'null') || { duration: 25, remaining: 25 * 60, endsAt: null, taskId: '' }
  } catch {
    return { duration: 25, remaining: 25 * 60, endsAt: null, taskId: '' }
  }
}

export function Focus() {
  const { tasks, focusSessions, addFocusSession, updateTask, toast } = useApp()
  const { toggle } = useTaskUI()
  const navigate = useNavigate()
  const [timer, setTimer] = useState(loadTimer)
  const [now, setNow] = useState(Date.now())
  const [customMinutes, setCustomMinutes] = useState('')
  const finished = useRef(false)
  const pending = useMemo(() => tasks.filter((task) => !task.completed && !task.archived), [tasks])
  const selected = pending.find((task) => task.id === timer.taskId) || pending[0] || null
  const active = Boolean(timer.endsAt)
  const remaining = active ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.remaining
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = timer.duration ? 1 - remaining / (timer.duration * 60) : 0
  const radius = 120
  const circumference = Math.PI * 2 * radius

  useEffect(() => localStorage.setItem(TIMER_KEY, JSON.stringify({ ...timer, taskId: selected?.id || '' })), [timer, selected?.id])
  useEffect(() => {
    if (!active) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])

  const stopTimer = useCallback((completed) => {
    if (finished.current) return
    finished.current = true
    const elapsed = Math.max(1, timer.duration - Math.ceil(remaining / 60))
    addFocusSession({ taskId: selected?.id || null, taskTitle: selected?.title || 'Focus session', plannedMinutes: timer.duration, actualMinutes: elapsed, completed })
    if (selected) updateTask(selected.id, { actualMinutes: (selected.actualMinutes || 0) + elapsed })
    setTimer((current) => ({ ...current, endsAt: null, remaining: current.duration * 60 }))
    localStorage.removeItem(TIMER_KEY)
    toast(completed ? 'Focus session complete' : 'Focus session saved', { description: `${elapsed} focused minutes added to your history.`, tone: completed ? 'celebrate' : 'info' })
  }, [addFocusSession, remaining, selected, timer.duration, toast, updateTask])

  useEffect(() => {
    if (active && remaining === 0 && !finished.current) stopTimer(true)
  }, [active, remaining, stopTimer])

  const chooseDuration = (duration) => {
    finished.current = false
    setTimer({ duration, remaining: duration * 60, endsAt: null, taskId: selected?.id || '' })
  }

  const start = () => {
    finished.current = false
    setTimer((current) => ({ ...current, taskId: selected?.id || '', endsAt: Date.now() + current.remaining * 1000 }))
  }

  const pause = () => setTimer((current) => ({ ...current, endsAt: null, remaining: Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000)) }))
  const sessionsToday = focusSessions.filter((session) => new Date(session.createdAt).toDateString() === new Date().toDateString())
  const minutesToday = sessionsToday.reduce((sum, session) => sum + Number(session.actualMinutes || 0), 0)

  if (!selected) return <EmptyState icon={FocusIcon} title="Ready for a focused session?" message="Add a task first, then choose what to work on here." actionLabel="Go to tasks" onAction={() => navigate('/tasks')} />

  return (
    <div className="space-y-6">
      <PageHeader icon={FocusIcon} eyebrow="Deep work" title="Focus mode" subtitle="A quiet space for one task at a time." actions={<button className="btn btn-ghost" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button>} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-to-br from-[#121b3b] via-[#20235b] to-[#46318a] px-5 py-8 text-white shadow-xl shadow-indigo-950/20 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
            <p className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-100"><Sparkles size={14} />{active ? 'Session in progress' : 'Focus session'}</p>
            <div className="relative mt-6 grid h-64 w-64 place-items-center sm:h-72 sm:w-72">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 272 272" aria-hidden="true"><circle cx="136" cy="136" r={radius} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8"/><circle cx="136" cy="136" r={radius} fill="none" stroke="url(#focusGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-[stroke-dashoffset] duration-500"/><defs><linearGradient id="focusGradient"><stop stopColor="#a5b4fc"/><stop offset="1" stopColor="#e9d5ff"/></linearGradient></defs></svg>
              <div><p className="font-display text-6xl font-extrabold tabular-nums tracking-tight">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p><p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-white/60">{active ? 'remaining' : 'minutes'}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{PRESETS.map((preset) => <button type="button" key={preset} disabled={active} onClick={() => chooseDuration(preset)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${timer.duration === preset ? 'border-white/35 bg-white/20 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}>{preset} min</button>)}<label className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/5"><input aria-label="Custom focus minutes" inputMode="numeric" type="number" min="1" max="240" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} placeholder="Custom" className="w-20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/45 outline-none"/><button type="button" disabled={active || !Number(customMinutes)} onClick={() => chooseDuration(Math.min(240, Math.max(1, Number(customMinutes))))} className="border-l border-white/10 px-3 py-2 text-xs font-bold disabled:opacity-40">Set</button></label></div>
            <div className="mt-5 flex gap-3">{active ? <button type="button" className="btn bg-white text-indigo-800 hover:bg-white/90" onClick={pause}><Pause size={16} />Pause</button> : <button type="button" className="btn bg-white text-indigo-800 hover:bg-white/90" onClick={start}>{remaining < timer.duration * 60 ? <CirclePlay size={16}/> : <Play size={16}/>}Start focus</button>}{remaining < timer.duration * 60 && <button type="button" className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => stopTimer(false)}><SkipForward size={16}/>Finish early</button>}<button type="button" className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => chooseDuration(timer.duration)}><RotateCcw size={16}/><span className="sr-only">Reset timer</span></button></div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6"><h2 className="font-display text-base font-bold text-ink">Working on</h2><label htmlFor="focus-task" className="sr-only">Select a focus task</label><select id="focus-task" className="field mt-3" value={selected.id} disabled={active} onChange={(event) => setTimer((current) => ({ ...current, taskId: event.target.value }))}>{pending.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg font-bold text-ink">{selected.title}</h3><PriorityBadge priority={selected.priorityMode === 'urgent' ? 'high' : selected.priorityMode === 'none' ? 'low' : selected.priorityMode} /></div><p className="mt-1 text-sm leading-relaxed text-ink-2">{selected.description || 'Keep your attention on this task until the timer ends.'}</p><p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-3"><Clock3 size={14}/>{selected.estimatedMinutes ? `${selected.estimatedMinutes} min estimated` : 'No estimate set'}</p><button type="button" onClick={() => toggle(selected)} className="btn btn-primary mt-4 w-full"><Check size={16}/>Complete task</button></div></section>
          <section className="card p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold text-ink">Today's focus</h2><span className="chip bg-accent-soft text-accent">{sessionsToday.length} sessions</span></div><p className="mt-2 font-display text-3xl font-extrabold text-ink">{minutesToday}<span className="ml-1 text-sm font-semibold text-ink-3">minutes</span></p><div className="mt-4 space-y-2">{focusSessions.slice(0, 4).map((session) => <div key={session.id} className="flex items-center justify-between gap-3 border-t border-line pt-2 text-sm"><span className="truncate text-ink-2">{session.taskTitle}</span><span className="shrink-0 font-semibold text-ink">{session.actualMinutes}m</span></div>)}{focusSessions.length === 0 && <p className="text-sm text-ink-3">Your completed sessions will appear here.</p>}</div></section>
        </div>
      </div>
    </div>
  )
}
