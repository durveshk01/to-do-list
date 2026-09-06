import { ArrowRight, BrainCircuit, Check, CircleCheckBig, Clock } from 'lucide-react'
import { PriorityBadge } from './PriorityBadge.jsx'
import { analyze } from '../lib/priority.js'
import { formatDateTime, relativeDue } from '../lib/date.js'
import { useTaskUI } from '../store/TaskUI.jsx'

/**
 * The signature card: what should I do next, and why.
 */
export function SmartFocusCard({ task, className = '' }) {
  const { openDetail, complete, openAdd } = useTaskUI()

  if (!task) {
    return (
      <section
        className={`relative overflow-hidden rounded-xl2 border border-accent/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-6 text-white ${className}`}
      >
        <div className="grid-lines absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative">
          <p className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-white/80">
            <BrainCircuit size={16} />
            Smart Priority Detection
          </p>
          <h2 className="mt-3 font-display text-xl font-extrabold">Nothing left to prioritise 🎉</h2>
          <p className="mt-2 max-w-md text-[0.88rem] text-white/75">
            Every pending task is done. Add the next one and Smart Priority will rank it instantly.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="btn mt-5 bg-white/95 text-indigo-700 hover:bg-white"
          >
            Add a task
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    )
  }

  const { score, priority, factors, manual, autoPriority } = analyze(task)

  return (
    <section
      className={`relative overflow-hidden rounded-xl2 border border-indigo-500/25 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-5 text-white shadow-xl shadow-indigo-500/20 sm:p-6 ${className}`}
    >
      <div className="grid-lines absolute inset-0 opacity-25" aria-hidden="true" />
      <div
        className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[0.76rem] font-bold uppercase tracking-[0.12em] text-white/85">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
              <BrainCircuit size={15} />
            </span>
            Smart Priority Detection
          </p>
          <span className="chip bg-white/15 px-2.5 py-1 text-[0.7rem] text-white">Focus next</span>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[1.35rem] font-extrabold leading-snug sm:text-[1.5rem]">{task.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.82rem] text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {relativeDue(task)} • {formatDateTime(task)}
              </span>
              <span className="chip bg-white/15 text-white">{task.category}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`chip px-2.5 py-1 text-[0.74rem] font-bold ${
                  priority === 'high'
                    ? 'bg-white text-red-600'
                    : priority === 'medium'
                      ? 'bg-white text-amber-600'
                      : 'bg-white text-blue-600'
                }`}
              >
                {priority === 'high' ? '🔴' : priority === 'medium' ? '🟠' : '🔵'}{' '}
                {priority.toUpperCase()} PRIORITY
              </span>
              {manual && <span className="chip bg-white/15 text-white">Manual override (auto: {autoPriority})</span>}
            </div>
          </div>

          {/* score dial */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm lg:flex-col lg:gap-2">
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold leading-none">{score}</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-wide text-white/70">of 100</p>
            </div>
            <div className="h-10 w-px bg-white/20 lg:hidden" aria-hidden="true" />
            <div className="lg:w-full">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/25 lg:w-full">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-1.5 text-[0.68rem] text-white/70">Urgency score</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
          <p className="text-[0.76rem] font-bold uppercase tracking-wide text-white/80">Why is this important?</p>
          <ul className="mt-2 grid gap-1.5 grid-cols-1 sm:grid-cols-2">
            {factors
              .filter((f) => f.points > 0)
              .map((f, i) => (
                <li key={`${f.label}-${i}`} className="flex items-center gap-2 text-[0.8rem] text-white/90">
                  <Check size={13} strokeWidth={3} className="shrink-0 text-emerald-300" />
                  {f.label}
                </li>
              ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => openDetail(task)}
            className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20"
          >
            View task
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => complete(task)}
            className="btn bg-white text-indigo-700 hover:bg-white/90"
          >
            <CircleCheckBig size={16} />
            Mark complete
          </button>
        </div>
      </div>
    </section>
  )
}
