import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Bell, CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles, TrendingUp } from 'lucide-react'
import { Logo, LogoMark } from '../components/Logo.jsx'
import { useApp } from '../store/AppStore.jsx'

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'Smart Priority Detection', body: 'Every task gets an urgency score, not just a label.' },
  { icon: Bell, title: 'Never miss a deadline', body: 'Reminders and a live deadline timeline keep you ahead.' },
  { icon: TrendingUp, title: 'See your progress', body: 'Weekly productivity charts that actually motivate.' },
]

export function Login() {
  const { user, login, toast } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Please enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim()))
      next.email = 'That email address does not look valid.'
    if (!form.password) next.password = 'Please enter your password.'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.'
    return next
  }

  const submit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    setTimeout(() => {
      login(form.email.trim(), form.remember)
      toast('Welcome back!', { description: 'Your dashboard is ready.' })
      navigate('/dashboard', { replace: true })
    }, 550)
  }

  const fillDemo = () => setForm({ email: 'durvesh@student.edu', password: 'smarttodo', remember: true })

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[#0d1533] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="mesh absolute inset-0 opacity-90" aria-hidden="true" />
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1533] via-[#0d1533]/55 to-transparent" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <p className="font-display text-lg font-extrabold">Smart To-Do</p>
            <p className="text-[0.72rem] text-white/60">Intelligent Priority Detection</p>
          </div>
        </div>

        <div className="relative mt-auto max-w-lg">
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.08] xl:text-[3rem]">
            Know what matters.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              Do what matters first.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-white/70">
            Organize your tasks. Detect priorities. Never miss a deadline.
          </p>

          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-200">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-[0.88rem] font-bold">{title}</span>
                  <span className="mt-0.5 block text-[0.8rem] text-white/60">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-6 border-t border-white/10 pt-6 text-white/70">
            <div>
              <p className="font-display text-2xl font-extrabold text-white">100</p>
              <p className="text-[0.72rem]">point urgency scale</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-white">3</p>
              <p className="text-[0.72rem]">priority levels</p>
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-white">0</p>
              <p className="text-[0.72rem]">missed deadlines</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login card */}
      <section className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <div className="mb-7 flex justify-center lg:hidden">
            <Logo size={46} />
          </div>

          <div className="card animate-rise p-6 sm:p-8">
            <h2 className="font-display text-[1.55rem] font-extrabold text-ink">Welcome back 👋</h2>
            <p className="mt-1.5 text-[0.86rem] text-ink-2">Sign in to see what needs your attention today.</p>

            <form onSubmit={submit} noValidate className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[0.8rem] font-semibold text-ink">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`field pl-9 ${errors.email ? 'field-error' : ''}`}
                    placeholder="you@college.edu"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high">
                    <AlertCircle size={13} />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[0.8rem] font-semibold text-ink">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`field pl-9 pr-10 ${errors.password ? 'field-error' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 transition hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high">
                    <AlertCircle size={13} />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-medium text-ink-2">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                    className="h-4 w-4 rounded border-line-strong accent-indigo-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast('Password reset link sent', {
                      tone: 'info',
                      description: 'Check your college inbox — this is a prototype, so nothing was really sent.',
                    })
                  }
                  className="text-[0.8rem] font-semibold text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={busy} className="btn btn-primary w-full !py-2.5">
                {busy ? 'Signing you in…' : 'Login'}
                {!busy && <ArrowRight size={16} />}
              </button>

              <button type="button" onClick={fillDemo} className="btn btn-ghost w-full">
                <CheckCircle2 size={16} />
                Use demo account
              </button>
            </form>

            <p className="mt-6 text-center text-[0.82rem] text-ink-2">
              New here?{' '}
              <button
                type="button"
                onClick={() =>
                  toast('Sign up is coming soon', {
                    tone: 'info',
                    description: 'For this prototype, any valid email and password works.',
                  })
                }
                className="font-semibold text-accent hover:underline"
              >
                Create an account
              </button>
            </p>
          </div>

          <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-ink-3">
            Demo prototype — any valid-looking email and a 6+ character password will sign you in.
            <br />
            Your tasks are stored locally in this browser.
          </p>
        </div>
      </section>
    </div>
  )
}
