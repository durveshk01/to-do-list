export function PageHeader({ eyebrow, title, subtitle, icon: Icon, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <Icon size={20} />
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
          )}
          <h1 className="font-display text-[1.45rem] font-extrabold leading-tight text-ink sm:text-[1.65rem]">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[0.85rem] text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-[1.02rem] font-bold text-ink">
          {Icon && <Icon size={17} className="text-accent" />}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[0.78rem] text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
