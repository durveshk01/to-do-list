import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/** Accessible dialog shell: Escape to close, focus trap, scroll lock, click-outside. */
export function Modal({ open, onClose, title, description, icon, children, footer, size = 'md', variant = 'center' }) {
  const panelRef = useRef(null)
  const restoreTo = useRef(null)

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus]') || panelRef.current
      target?.focus?.()
    }, 40)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      clearTimeout(t)
      restoreTo.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-3xl' }
  const isDrawer = variant === 'drawer'

  return (
    <div
      className={`fixed inset-0 z-[70] flex ${isDrawer ? 'justify-end' : 'items-end justify-center sm:items-center'}`}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Dialog'}
    >
      <div
        className="absolute inset-0 animate-fade bg-slate-950/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative flex max-h-[94dvh] w-full flex-col bg-surface shadow-2xl outline-none ${
          isDrawer
            ? 'h-full animate-slide-in rounded-t-3xl sm:max-w-lg sm:rounded-l-3xl sm:rounded-tr-none'
            : `animate-pop rounded-t-3xl sm:rounded-3xl ${widths[size]}`
        }`}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-2">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-xl p-2 text-ink-3 transition hover:bg-surface-3 hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
