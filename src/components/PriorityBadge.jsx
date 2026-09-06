import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Minus } from 'lucide-react'
import { PRIORITY_META } from '../lib/priority.js'

const ICONS = {
  high: AlertTriangle,
  medium: Minus,
  low: ArrowDown,
  completed: CheckCircle2,
}

const STYLES = {
  high: 'bg-high/12 text-high ring-1 ring-inset ring-high/25',
  medium: 'bg-medium/14 text-medium ring-1 ring-inset ring-medium/28',
  low: 'bg-low/12 text-low ring-1 ring-inset ring-low/25',
  completed: 'bg-done/12 text-done ring-1 ring-inset ring-done/25',
}

/**
 * Priority is always communicated with an icon + words, never colour alone.
 */
export function PriorityBadge({ priority = 'low', full = false, size = 'sm', className = '' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.low
  const Icon = ICONS[priority] || ArrowUp
  const pad = size === 'md' ? 'px-2.5 py-1 text-[0.76rem]' : 'px-2 py-[3px] text-[0.7rem]'
  return (
    <span className={`chip ${STYLES[priority]} ${pad} ${className}`} title={meta.label}>
      <Icon size={size === 'md' ? 14 : 12} aria-hidden="true" strokeWidth={2.6} />
      {full ? meta.label : meta.short}
    </span>
  )
}

export function PriorityDot({ priority = 'low', className = '' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.low
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ background: meta.color }}
      aria-label={meta.label}
      title={meta.label}
    />
  )
}
