import { useEffect, useState } from 'react'

export const CHART_COLORS = {
  high: 'var(--chart-high)',
  medium: 'var(--chart-medium)',
  low: 'var(--chart-low)',
  done: 'var(--chart-done)',
}

/** Numbers that count up when they change — used on the stat cards. */
export function CountUp({ value = 0, duration = 700, className = '', suffix = '' }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const from = display
    const delta = value - from
    if (delta === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + delta * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}

/**
 * Hero completion figure. One value, so no legend — the caption names it.
 */
export function ProgressRing({ value = 0, size = 156, stroke = 13, label = 'Completed', sublabel }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${pct}% ${label}`}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="var(--chart-done)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-[1.8rem] font-extrabold leading-none text-ink">
          <CountUp value={pct} suffix="%" />
        </div>
        <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
        {sublabel && <div className="mt-0.5 text-[0.7rem] text-ink-3">{sublabel}</div>}
      </div>
    </div>
  )
}

/**
 * Weekly completed tasks. Single series → no legend; only the best day and today
 * get a direct label so the axis stays quiet.
 */
export function WeeklyBars({ data = [], height = 132 }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const best = Math.max(...data.map((d) => d.value))

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((d) => {
          const h = (d.value / max) * 100
          const emphasise = d.value > 0 && (d.value === best || d.isToday)
          return (
            <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={`text-[0.68rem] font-bold tabular-nums transition ${
                  emphasise ? 'text-ink' : 'text-transparent group-hover:text-ink-2'
                }`}
              >
                {d.value}
              </span>
              <div
                className="relative w-full overflow-hidden rounded-md transition-all duration-500"
                style={{
                  height: `${Math.max(d.value === 0 ? 3 : 8, h)}%`,
                  background:
                    d.value === 0
                      ? 'var(--chart-grid)'
                      : d.isToday
                        ? 'linear-gradient(180deg,#818cf8,#6366f1)'
                        : 'var(--chart-done)',
                  opacity: d.value === 0 ? 1 : d.isToday ? 1 : 0.88,
                }}
                title={`${d.full}: ${d.value} task${d.value === 1 ? '' : 's'} completed`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 border-t border-line pt-2 sm:gap-2.5">
        {data.map((d) => (
          <div
            key={d.label}
            className={`min-w-0 flex-1 text-center text-[0.68rem] font-semibold ${
              d.isToday ? 'text-accent' : 'text-ink-3'
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Priority distribution. Segments carry a 2px surface gap, a legend is always
 * present and every slice is labelled with its count (never colour alone).
 */
export function PriorityDonut({ data = [], size = 168, stroke = 22 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = 2.5

  let cursor = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Pending tasks by priority">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} />
          {total > 0 &&
            data.map((d) => {
              if (!d.value) return null
              const len = (d.value / total) * c
              const dash = Math.max(0, len - gap)
              const el = (
                <circle
                  key={d.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-cursor}
                  style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.22,1,0.36,1)' }}
                >
                  <title>{`${d.label}: ${d.value} of ${total}`}</title>
                </circle>
              )
              cursor += len
              return el
            })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <div className="font-display text-2xl font-extrabold leading-none text-ink">
            <CountUp value={total} />
          </div>
          <div className="mt-1 text-[0.66rem] font-semibold uppercase tracking-wide text-ink-3">Pending</div>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden="true" />
            <span className="flex-1 text-[0.82rem] font-medium text-ink-2">{d.label}</span>
            <span className="text-[0.82rem] font-bold tabular-nums text-ink">{d.value}</span>
            <span className="w-10 text-right text-[0.72rem] tabular-nums text-ink-3">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Slim horizontal meter used inside stat and category cards. */
export function Meter({ value = 0, max = 100, color = 'var(--chart-done)', className = '' }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
