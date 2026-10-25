import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Focus, LayoutDashboard, ListChecks, Plus, Sparkles } from 'lucide-react'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { CommandPalette } from './CommandPalette.jsx'
import { haptic, setupBackButton } from '../lib/native.js'

const MOBILE_NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, badgeKey: 'pending' },
  { to: '/priority', label: 'Priority', icon: Sparkles, badgeKey: 'urgent' },
  { to: '/focus', label: 'Focus', icon: Focus },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('smart-todo:sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { stats } = useApp()
  const { openAdd } = useTaskUI()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('smart-todo:sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Native Android hardware back-button support
  useEffect(() => {
    const cleanup = setupBackButton(() => {
      if (mobileOpen) {
        setMobileOpen(false)
      } else if (location.pathname !== '/dashboard' && location.pathname !== '/login') {
        navigate(-1)
      } else {
        CapApp.exitApp()
      }
    })
    return cleanup
  }, [mobileOpen, location.pathname, navigate])

  const getBadgeValue = (key) => {
    if (key === 'pending') return stats.pending
    if (key === 'urgent') return stats.urgentCount
    return 0
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-dvh flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[262px]'
        }`}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />

        <main
          key={location.pathname}
          className="mx-auto w-full max-w-[1400px] flex-1 animate-rise px-4 pb-36 pt-4 sm:px-6 sm:pb-10 sm:pt-6"
          style={{
            paddingLeft: 'max(1rem, max(env(safe-area-inset-left, 0px), var(--safe-area-inset-left, 0px)))',
            paddingRight: 'max(1rem, max(env(safe-area-inset-right, 0px), var(--safe-area-inset-right, 0px)))',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Native-style mobile bottom navigation bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-xl sm:hidden select-none"
        style={{
          paddingBottom: 'max(0.65rem, max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)))',
          paddingLeft: 'max(0.25rem, max(env(safe-area-inset-left, 0px), var(--safe-area-inset-left, 0px)))',
          paddingRight: 'max(0.25rem, max(env(safe-area-inset-right, 0px), var(--safe-area-inset-right, 0px)))',
        }}
        aria-label="Quick navigation"
      >
        <div className="grid grid-cols-5 items-center">
          {MOBILE_NAV.slice(0, 2).map(({ to, label, icon: Icon, badgeKey }) => (
            <MobileTab key={to} to={to} label={label} Icon={Icon} badge={getBadgeValue(badgeKey)} />
          ))}

          <div className="grid place-items-center">
            <button
              type="button"
              onClick={() => {
                haptic.light()
                openAdd()
              }}
              aria-label="Add new task"
              className="-mt-5 grid h-13 w-13 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/35 transition active:scale-95 touch-manipulation"
            >
              <Plus size={22} />
            </button>
          </div>

          {MOBILE_NAV.slice(2).map(({ to, label, icon: Icon, badgeKey }) => (
            <MobileTab key={to} to={to} label={label} Icon={Icon} badge={getBadgeValue(badgeKey)} />
          ))}
        </div>
      </nav>

      <CommandPalette />
    </div>
  )
}

function MobileTab({ to, label, Icon, badge }) {
  return (
    <NavLink
      to={to}
      onClick={() => haptic.selection()}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2.5 text-[0.66rem] font-semibold transition active:opacity-70 ${
          isActive ? 'text-accent' : 'text-ink-3'
        }`
      }
    >
      {({ isActive }) => (
        <span className="relative flex flex-col items-center">
          <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
          {badge > 0 ? (
            <span className="absolute -top-1 -right-2.5 grid min-w-4 h-4 place-items-center rounded-full bg-accent px-1 text-[0.58rem] font-bold text-white shadow-sm">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
          <span className="mt-0.5">{label}</span>
        </span>
      )}
    </NavLink>
  )
}
