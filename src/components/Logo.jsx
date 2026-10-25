import { useId } from 'react'

export function LogoMark({ size = 40, className = '' }) {
  const id = `taskflow-${useId().replace(/:/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="TaskFlow logo"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill={`url(#${id})`} />
      <rect x="3.75" y="3.75" width="40.5" height="40.5" rx="12.25" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" />
      <path
        d="M14.5 24.5 L20.5 30.5 L33 18"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M35.5 9 L37 13 L41 14.5 L37 16 L35.5 20 L34 16 L30 14.5 L34 13 Z" fill="#FBBF24" />
    </svg>
  )
}

export function Logo({ size = 40, subtitle = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="font-display text-[1.05rem] font-extrabold text-ink">TaskFlow</div>
        {subtitle && <div className="text-[0.68rem] font-medium text-ink-3">Work, in flow.</div>}
      </div>
    </div>
  )
}
