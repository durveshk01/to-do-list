import { AlertTriangle, Bell, BellRing, CheckCheck, CheckCircle2, Clock, Eraser, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { PriorityBadge } from '../components/PriorityBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { humanStamp } from '../lib/date.js'

const SECTIONS = [
  {
    key: 'urgent',
    title: 'Urgent',
    subtitle: 'Due today or already overdue',
    icon: AlertTriangle,
    accent: 'border-high/25 bg-high/[0.05]',
    iconClass: 'bg-high/12 text-high',
  },
  {
    key: 'upcoming',
    title: 'Upcoming',
    subtitle: 'Deadlines approaching in the next few days',
    icon: Clock,
    accent: 'border-medium/25 bg-medium/[0.05]',
    iconClass: 'bg-medium/12 text-medium',
  },
  {
    key: 'completed',
    title: 'Completed',
    subtitle: 'Recent task completions',
    icon: CheckCircle2,
    accent: 'border-done/25 bg-done/[0.05]',
    iconClass: 'bg-done/12 text-done',
  },
]

export function Notifications() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    clearAllNotifications,
    restoreNotifications,
    tasks,
    settings,
    setSettings,
    toast,
  } = useApp()
  const { openDetail, openAdd } = useTaskUI()

  const enableBrowser = async () => {
    if (typeof Notification === 'undefined') {
      toast('Browser notifications not supported', { tone: 'error', description: 'In-app alerts will keep working.' })
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setSettings((s) => ({ ...s, browserNotifications: true }))
      toast('Browser notifications enabled', { description: 'Urgent deadlines will now pop up outside the app too.' })
    } else {
      toast('Permission denied', { tone: 'info', description: 'No problem — in-app notifications still work.' })
    }
  }

  return (
    <div>
      <PageHeader
        icon={Bell}
        eyebrow="Reminders"
        title="Notifications"
        subtitle={
          unreadCount
            ? `${unreadCount} unread of ${notifications.length} notifications`
            : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}, all read`
        }
        actions={
          <>
            {!settings.browserNotifications && (
              <button type="button" onClick={enableBrowser} className="btn btn-ghost">
                <BellRing size={16} />
                Enable browser alerts
              </button>
            )}
            {unreadCount > 0 && (
              <button type="button" onClick={markAllNotificationsRead} className="btn btn-ghost">
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button type="button" onClick={clearAllNotifications} className="btn btn-primary">
                <Eraser size={16} />
                Clear all
              </button>
            )}
          </>
        }
      />

      {notifications.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={Bell}
            tone="done"
            title="You're all caught up 🎉"
            message="No reminders waiting. New alerts appear here as deadlines get closer."
            actionLabel="Add a task"
            onAction={openAdd}
          />
          <div className="text-center">
            <button type="button" onClick={restoreNotifications} className="text-[0.8rem] font-semibold text-accent hover:underline">
              Restore cleared notifications
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {SECTIONS.map((section) => {
            const items = notifications.filter((n) => n.group === section.key)
            if (!items.length) return null
            const Icon = section.icon
            return (
              <section key={section.key} className="card overflow-hidden">
                <header className={`flex items-center gap-3 border-b border-line px-4 py-3 ${section.accent}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${section.iconClass}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[0.95rem] font-bold text-ink">{section.title}</h2>
                    <p className="text-[0.74rem] text-ink-2">{section.subtitle}</p>
                  </div>
                  <span className="chip bg-surface text-ink-2">{items.length}</span>
                </header>

                <ul>
                  {items.map((n, i) => {
                    const task = tasks.find((t) => t.id === n.taskId)
                    return (
                      <li
                        key={n.id}
                        className={`animate-rise flex items-start gap-3 border-b border-line px-4 py-3.5 transition last:border-0 hover:bg-surface-2 ${
                          n.read ? 'opacity-70' : ''
                        }`}
                        style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
                      >
                        {!n.read ? (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                        ) : (
                          <span className="mt-2 h-2 w-2 shrink-0" aria-hidden="true" />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id)
                            if (task) openDetail(task)
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="flex flex-wrap items-center gap-2 text-[0.88rem] font-semibold text-ink">
                            {n.title}
                            <PriorityBadge priority={n.priority} />
                          </p>
                          <p className="mt-0.5 text-[0.78rem] text-ink-2">{n.body}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-ink-3">
                            <Clock size={11} />
                            {humanStamp(n.at)}
                            {task ? ` • ${task.category}` : ''}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(n.id)}
                              aria-label="Mark as read"
                              title="Mark as read"
                              className="rounded-lg p-1.5 text-ink-3 transition hover:bg-surface-3 hover:text-accent"
                            >
                              <CheckCheck size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => clearNotification(n.id)}
                            aria-label="Clear notification"
                            title="Clear notification"
                            className="rounded-lg p-1.5 text-ink-3 transition hover:bg-high/10 hover:text-high"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}

          <p className="text-center text-[0.74rem] text-ink-3">
            Notifications are generated live from your deadlines.{' '}
            <button type="button" onClick={restoreNotifications} className="font-semibold text-accent hover:underline">
              Restore cleared ones
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
