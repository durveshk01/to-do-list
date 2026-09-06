import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ListChecks,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { Logo, LogoMark } from './Logo.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'My Tasks', icon: ListChecks, badge: 'pending' },
  { to: '/priority', label: 'Smart Priority', icon: Sparkles, highlight: true },
  { to: '/calendar', label: 'Calendar & Deadlines', icon: CalendarDays },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/analytics', label: 'Task Analytics', icon: BarChart3 },
  { to: '/completed', label: 'Completed', icon: CheckCheck, badge: 'completed' },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, stats, unreadCount, logout, toast } = useApp()
  const { openAdd } = useTaskUI()
  const navigate = useNavigate()

  const badgeValue = (kind) =>
    kind === 'pending' ? stats.pending : kind === 'unread' ? unreadCount : kind === 'completed' ? stats.completed : 0

  const handleLogout = () => {
    logout()
    toast('Signed out', { tone: 'info', description: 'Your tasks stay saved on this device.' })
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:z-30 lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-[262px]'
        } w-[272px] ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          {collapsed ? (
            <span className="hidden lg:block">
              <LogoMark size={36} />
            </span>
          ) : null}
          <div className={collapsed ? 'lg:hidden' : ''}>
            <Logo />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-2 text-ink-3 transition hover:bg-surface-3 hover:text-ink lg:hidden"
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`ml-auto hidden rounded-lg p-2 text-ink-3 transition hover:bg-surface-3 hover:text-ink lg:block ${
              collapsed ? 'lg:ml-0' : ''
            }`}
          >
            <ChevronLeft size={17} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className={`px-3 pb-2 ${collapsed ? 'lg:px-2' : ''}`}>
          <button
            type="button"
            onClick={() => {
              onCloseMobile?.()
              openAdd()
            }}
            className={`btn btn-primary w-full ${collapsed ? 'lg:px-0' : ''}`}
            title="Add new task"
          >
            <Plus size={17} />
            <span className={collapsed ? 'lg:hidden' : ''}>Add New Task</span>
          </button>
        </div>

        <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, badge, highlight }) => {
            const count = badge ? badgeValue(badge) : 0
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.86rem] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/12 to-violet-500/10 text-accent'
                      : 'text-ink-2 hover:bg-surface-3 hover:text-ink'
                  } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 h-6 w-1 rounded-r-full bg-accent transition-all duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden="true"
                    />
                    <Icon
                      size={18}
                      className={highlight && !isActive ? 'text-accent-2' : ''}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span className={`flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
                    {count > 0 && (
                      <span
                        className={`chip shrink-0 px-1.5 py-0 text-[0.66rem] ${
                          badge === 'unread' ? 'bg-high/12 text-high' : 'bg-surface-3 text-ink-2'
                        } ${collapsed ? 'lg:hidden' : ''}`}
                      >
                        {count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className={`border-t border-line p-3 ${collapsed ? 'lg:px-2' : ''}`}>
          <div
            className={`flex items-center gap-3 rounded-xl bg-surface-2 p-2.5 ${collapsed ? 'lg:justify-center lg:p-1.5' : ''}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[0.8rem] font-bold text-white">
              {(user?.name || 'S')
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-[0.82rem] font-bold text-ink">{user?.name || 'Student'}</p>
              <p className="truncate text-[0.7rem] text-ink-3">{user?.email || 'student@email.com'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className={`rounded-lg p-1.5 text-ink-3 transition hover:bg-high/10 hover:text-high ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
