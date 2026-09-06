import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  ChevronDown,
  CircleUser,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import { PriorityBadge, PriorityDot } from './PriorityBadge.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { analyze } from '../lib/priority.js'
import { humanStamp, longToday, shortDue } from '../lib/date.js'

function useOutside(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) onClose()
    }
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return ref
}

function SearchBox({ id = 'global-search' }) {
  const { tasks } = useApp()
  const { openDetail } = useTaskUI()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useOutside(() => setOpen(false))
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term),
      )
      .slice(0, 6)
  }, [q, tasks])

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        Search tasks
      </label>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <input
        id={id}
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && q.trim()) {
            setOpen(false)
            navigate(`/tasks?q=${encodeURIComponent(q.trim())}`)
          }
        }}
        placeholder="Search tasks…"
        className="field !py-2 pl-9 pr-16"
        autoComplete="off"
      />
      {q ? (
        <button
          type="button"
          onClick={() => setQ('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-3 hover:text-ink"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink-3 sm:block">
          Ctrl K
        </kbd>
      )}

      {open && q.trim() && (
        <div className="card absolute left-0 right-0 top-12 z-40 animate-pop overflow-hidden p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[0.82rem] text-ink-2">
              No tasks match “{q.trim()}”.
            </p>
          ) : (
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setOpen(false)
                  openDetail(t)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-surface-3"
              >
                <PriorityDot priority={t.completed ? 'completed' : analyze(t).priority} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.84rem] font-semibold text-ink">{t.title}</span>
                  <span className="block truncate text-[0.72rem] text-ink-3">
                    {t.category} • {t.completed ? 'Completed' : shortDue(t)}
                  </span>
                </span>
              </button>
            ))
          )}
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate(`/tasks?q=${encodeURIComponent(q.trim())}`)
              }}
              className="mt-1 w-full rounded-lg bg-surface-2 px-3 py-2 text-[0.78rem] font-semibold text-accent transition hover:bg-accent-soft"
            >
              See all results in My Tasks
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, tasks } = useApp()
  const { openDetail } = useTaskUI()
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  const navigate = useNavigate()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className="relative rounded-xl border border-line bg-surface p-2.5 text-ink-2 transition hover:border-line-strong hover:text-ink"
      >
        {unreadCount > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-high px-1 text-[0.65rem] font-bold text-white ring-2 ring-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 top-13 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-pop overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-display text-[0.92rem] font-bold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[0.74rem] font-semibold text-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className="scroll-thin max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-[0.82rem] text-ink-2">You're all caught up 🎉</p>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id)
                    const task = tasks.find((t) => t.id === n.taskId)
                    setOpen(false)
                    if (task) openDetail(task)
                  }}
                  className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-surface-2 ${
                    n.read ? 'opacity-70' : ''
                  }`}
                >
                  <PriorityDot priority={n.priority} className="mt-1.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.82rem] font-semibold leading-snug text-ink">{n.title}</span>
                    <span className="mt-0.5 block text-[0.72rem] text-ink-2">{n.body}</span>
                    <span className="mt-1 block text-[0.68rem] text-ink-3">{humanStamp(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
            className="w-full border-t border-line bg-surface-2 px-4 py-2.5 text-[0.8rem] font-semibold text-accent transition hover:bg-accent-soft"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

function ProfileMenu() {
  const { user, settings, setSettings, logout, toast } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useOutside(() => setOpen(false))
  const navigate = useNavigate()
  const dark = settings.theme === 'dark'

  const initials = (user?.name || 'Student')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pr-2 transition hover:border-line-strong"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[0.75rem] font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[7.5rem] truncate text-[0.78rem] font-bold leading-tight text-ink">
            {user?.name || 'Student'}
          </span>
          <span className="block text-[0.66rem] leading-tight text-ink-3">Student</span>
        </span>
        <ChevronDown size={15} className={`text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-60 animate-pop overflow-hidden p-1.5">
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-[0.85rem] font-bold text-ink">{user?.name || 'Student'}</p>
            <p className="truncate text-[0.72rem] text-ink-3">{user?.email || 'student@email.com'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.82rem] font-medium text-ink-2 transition hover:bg-surface-3 hover:text-ink"
          >
            <CircleUser size={16} />
            My profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.82rem] font-medium text-ink-2 transition hover:bg-surface-3 hover:text-ink"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, theme: dark ? 'light' : 'dark' }))}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.82rem] font-medium text-ink-2 transition hover:bg-surface-3 hover:text-ink"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              logout()
              toast('Signed out', { tone: 'info', description: 'Your tasks stay saved on this device.' })
              navigate('/login')
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-line px-3 py-2 text-left text-[0.82rem] font-semibold text-high transition hover:bg-high/10"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onOpenMobileNav }) {
  const { openAdd } = useTaskUI()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="rounded-xl border border-line bg-surface p-2.5 text-ink-2 transition hover:text-ink lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="hidden min-w-0 flex-1 sm:block">
          <SearchBox id="global-search" />
        </div>
        <div className="min-w-0 flex-1 sm:hidden">
          <p className="truncate font-display text-[0.95rem] font-extrabold text-ink">Smart To-Do</p>
          <p className="truncate text-[0.68rem] text-ink-3">{longToday()}</p>
        </div>

        <p className="ml-auto hidden whitespace-nowrap text-[0.78rem] font-semibold text-ink-2 xl:block">
          {longToday()}
        </p>

        <button type="button" onClick={openAdd} className="btn btn-primary hidden md:inline-flex">
          <Plus size={16} />
          Add Task
        </button>

        <NotificationBell />
        <ProfileMenu />
      </div>

      <div className="px-4 pb-3 sm:hidden">
        <SearchBox id="mobile-search" />
      </div>
    </header>
  )
}
