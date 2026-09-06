import { AlertCircle, CheckCircle2, Info, PartyPopper, X } from 'lucide-react'
import { useApp } from '../store/AppStore.jsx'

const TONES = {
  success: { Icon: CheckCircle2, ring: 'ring-done/30', bar: 'bg-done', tint: 'text-done' },
  celebrate: { Icon: PartyPopper, ring: 'ring-accent/30', bar: 'bg-accent', tint: 'text-accent' },
  error: { Icon: AlertCircle, ring: 'ring-high/30', bar: 'bg-high', tint: 'text-high' },
  info: { Icon: Info, ring: 'ring-low/30', bar: 'bg-low', tint: 'text-low' },
}

export function Toasts() {
  const { toasts, dismissToast } = useApp()

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2.5 p-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:p-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const tone = TONES[t.tone] || TONES.success
        const { Icon } = tone
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`card pointer-events-auto relative flex w-full max-w-sm animate-toast-in items-start gap-3 overflow-hidden p-3.5 pl-4 pr-3 ring-1 ${tone.ring}`}
          >
            <span className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`} aria-hidden="true" />
            <Icon size={19} className={`mt-0.5 shrink-0 ${tone.tint}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.message}</p>
              {t.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action()
                    dismissToast(t.id)
                  }}
                  className="mt-2 rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent transition hover:brightness-95"
                >
                  {t.actionLabel || 'Undo'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-ink-3 transition hover:bg-surface-3 hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
