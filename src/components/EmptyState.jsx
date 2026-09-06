import { Plus } from 'lucide-react'

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, tone = 'accent', compact = false }) {
  const tones = {
    accent: 'from-indigo-500/15 to-violet-500/10 text-accent',
    done: 'from-emerald-500/15 to-teal-500/10 text-done',
    medium: 'from-amber-500/15 to-orange-500/10 text-medium',
  }
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-2/60 text-center ${
        compact ? 'px-6 py-8' : 'px-6 py-14'
      }`}
    >
      <div
        className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]} ring-1 ring-inset ring-line`}
      >
        {Icon && <Icon size={26} strokeWidth={1.9} />}
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[0.85rem] leading-relaxed text-ink-2">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary mt-5" onClick={onAction}>
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
