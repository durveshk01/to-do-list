import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CheckCheck, LayoutDashboard, ListChecks, Plus, Sparkles } from 'lucide-react'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'

const MOBILE_NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/priority', label: 'Priority', icon: Sparkles },
  { to: '/completed', label: 'Done', icon: CheckCheck },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('smart-todo:sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openAdd } = useTaskUI()
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem('smart-todo:sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

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

        <main key={location.pathname} className="mx-auto w-full max-w-[1400px] flex-1 animate-rise px-4 pb-28 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile quick navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
        aria-label="Quick navigation"
      >
        <div className="grid grid-cols-5 items-center">
          {MOBILE_NAV.slice(0, 2).map(({ to, label, icon: Icon }) => (
            <MobileTab key={to} to={to} label={label} Icon={Icon} />
          ))}
          <div className="grid place-items-center">
            <button
              type="button"
              onClick={openAdd}
              aria-label="Add new task"
              className="-mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/35 transition active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
          {MOBILE_NAV.slice(2).map(({ to, label, icon: Icon }) => (
            <MobileTab key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function MobileTab({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2.5 text-[0.66rem] font-semibold transition ${
          isActive ? 'text-accent' : 'text-ink-3'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
          {label}
        </>
      )}
    </NavLink>
  )
}
