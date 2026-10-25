import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BellRing,
  Check,
  Database,
  Download,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sliders,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  User,
} from 'lucide-react'
import { PageHeader, SectionHeader } from '../components/PageHeader.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { useApp } from '../store/AppStore.jsx'
import { CATEGORIES, REMINDER_OFFSETS } from '../lib/priority.js'
import { exportJson } from '../lib/storage.js'

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun, hint: 'Bright and crisp' },
  { value: 'dark', label: 'Dark', icon: Moon, hint: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, hint: 'Follow your device' },
]
const ACCENTS = ['indigo', 'violet', 'cyan', 'emerald', 'rose']
const PRIORITIES = ['auto', 'none', 'low', 'medium', 'high', 'urgent']
const SETTING_BOOLEANS = ['defaultReminder', 'browserNotifications', 'motivationalMessages', 'weekStartsMonday', 'autoArchiveCompleted', 'confirmBeforeDelete', 'compactMode', 'notificationOverdue', 'notificationUpcoming', 'notificationStreak']

function mergeImportedSettings(current, imported) {
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) return current
  const next = { ...current }
  for (const key of SETTING_BOOLEANS) if (typeof imported[key] === 'boolean') next[key] = imported[key]
  if (['light', 'dark', 'system'].includes(imported.theme)) next.theme = imported.theme
  if (ACCENTS.includes(imported.accentColor)) next.accentColor = imported.accentColor
  if (PRIORITIES.includes(imported.defaultPriority)) next.defaultPriority = imported.defaultPriority
  if (['medium', 'numeric', 'iso'].includes(imported.dateFormat)) next.dateFormat = imported.dateFormat
  if (['12h', '24h'].includes(imported.timeFormat)) next.timeFormat = imported.timeFormat
  if (typeof imported.defaultCategory === 'string') next.defaultCategory = imported.defaultCategory.slice(0, 60)
  if (['15', '25', '30', '45', '60', '90'].includes(String(imported.defaultDuration))) next.defaultDuration = Number(imported.defaultDuration)
  if (typeof imported.defaultReminderOffset === 'string' && REMINDER_OFFSETS.some((offset) => offset.value === imported.defaultReminderOffset)) next.defaultReminderOffset = imported.defaultReminderOffset
  if (Array.isArray(imported.customCategories)) next.customCategories = [...new Set(imported.customCategories.filter((item) => typeof item === 'string').map((item) => item.trim().slice(0, 40)).filter(Boolean))].slice(0, 40)
  return next
}

function Row({ title, description, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-[0.86rem] font-semibold text-ink">
            {title}
          </label>
        ) : (
          <p className="text-[0.86rem] font-semibold text-ink">{title}</p>
        )}
        {description && <p className="mt-0.5 text-[0.76rem] leading-relaxed text-ink-2">{description}</p>}
      </div>
      <div className="shrink-0 sm:w-56">{children}</div>
    </div>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Settings() {
  const { user, updateUser, settings, setSettings, stats, resetData, clearEverything, logout, toast, allTasks, replaceTasks, focusSessions, restoreFocusSessions } = useApp()
  const navigate = useNavigate()
  const importRef = useRef(null)

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' })
  }, [user?.name, user?.email])

  const dirty = profile.name !== (user?.name || '') || profile.email !== (user?.email || '')

  const patch = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const saveProfile = (e) => {
    e.preventDefault()
    const next = {}
    if (!profile.name.trim()) next.name = 'Please enter your name.'
    else if (profile.name.trim().length < 2) next.name = 'That name looks too short.'
    if (!profile.email.trim()) next.email = 'Please enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(profile.email.trim()))
      next.email = 'That email address does not look valid.'
    setErrors(next)
    if (Object.keys(next).length) {
      toast('Please fix the highlighted fields', { tone: 'error', description: Object.values(next)[0] })
      return
    }
    updateUser({ name: profile.name.trim(), email: profile.email.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    toast('Profile updated', { description: 'Your name and email were saved on this device.' })
  }

  const enableBrowserNotifications = async (want) => {
    if (!want) {
      patch('browserNotifications', false)
      toast('Browser alerts turned off', { tone: 'info', description: 'In-app notifications keep working as usual.' })
      return
    }
    if (typeof Notification === 'undefined') {
      toast('Not supported in this browser', {
        tone: 'error',
        description: 'The in-app notification centre will still show every reminder.',
      })
      return
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') {
      patch('browserNotifications', true)
      toast('Browser alerts enabled', { description: 'Urgent deadlines will pop up outside the app too.' })
    } else {
      toast('Permission denied', {
        tone: 'info',
        description: 'Your browser blocked alerts. In-app notifications still work.',
      })
    }
  }

  const handleLogout = () => {
    logout()
    toast('Signed out', { tone: 'info', description: 'Your tasks stay saved on this device.' })
    navigate('/login')
  }

  const handleExport = () => {
    const content = exportJson({ tasks: allTasks, settings, user, focusSessions })
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Backup exported', { description: `${allTasks.length} tasks saved to a JSON file.` })
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast('Backup is too large', { tone: 'error', description: 'Choose a JSON backup smaller than 10 MB.' })
      return
    }
    try {
      const backup = JSON.parse(await file.text())
      const result = replaceTasks(Array.isArray(backup) ? backup : backup.tasks)
      if (!result.valid) {
        toast('Backup could not be imported', { tone: 'error', description: result.error })
        return
      }
      if (backup.settings && typeof backup.settings === 'object') setSettings((current) => mergeImportedSettings(current, backup.settings))
      if (Array.isArray(backup.focusSessions)) restoreFocusSessions(backup.focusSessions)
      if (backup.user && typeof backup.user.name === 'string' && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(backup.user.email || '')) updateUser({ name: backup.user.name.trim().slice(0, 100) || 'Student', email: backup.user.email.slice(0, 254) })
      toast('Backup restored', { description: `${result.count} validated tasks are ready.` })
    } catch {
      toast('Backup could not be read', { tone: 'error', description: 'Choose a valid TaskFlow JSON backup file.' })
    }
  }

  const addCategory = () => {
    const name = newCategory.trim().slice(0, 40)
    if (!name) return
    const existing = [...CATEGORIES, ...(settings.customCategories || [])]
    if (existing.some((category) => category.toLowerCase() === name.toLowerCase())) {
      toast('Category already exists', { tone: 'info' })
      return
    }
    patch('customCategories', [...(settings.customCategories || []), name])
    setNewCategory('')
    toast('Category added', { description: name })
  }

  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Preferences"
        title="Settings"
        subtitle="Tune the app to the way you actually work."
      />

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          
          <section className="card p-5">
            <SectionHeader title="Profile" subtitle="Shown in the sidebar and on your dashboard" icon={User} />
            <form onSubmit={saveProfile} noValidate className="space-y-4">
              <div className="flex items-center gap-3.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-lg font-extrabold text-white shadow-lg shadow-indigo-500/25">
                  {(profile.name || 'S')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[1rem] font-bold text-ink">{user?.name || 'Student'}</p>
                  <p className="truncate text-[0.78rem] text-ink-2">{user?.email || 'student@email.com'}</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label htmlFor="set-name" className="mb-1.5 block text-[0.8rem] font-semibold text-ink">
                    Full name
                  </label>
                  <input
                    id="set-name"
                    className={`field ${errors.name ? 'field-error' : ''}`}
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'set-name-error' : undefined}
                  />
                  {errors.name && (
                    <p
                      id="set-name-error"
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high"
                    >
                      <AlertCircle size={13} />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="set-email" className="mb-1.5 block text-[0.8rem] font-semibold text-ink">
                    Email address
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    className={`field ${errors.email ? 'field-error' : ''}`}
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'set-email-error' : undefined}
                  />
                  {errors.email && (
                    <p
                      id="set-email-error"
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-[0.76rem] font-medium text-high"
                    >
                      <AlertCircle size={13} />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={!dirty} className="btn btn-primary">
                  {saved ? <Check size={16} /> : <Save size={16} />}
                  {saved ? 'Saved' : 'Save changes'}
                </button>
                {dirty && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfile({ name: user?.name || '', email: user?.email || '' })
                      setErrors({})
                    }}
                    className="btn btn-ghost"
                  >
                    Discard
                  </button>
                )}
              </div>
            </form>
          </section>

          
          <section className="card p-5">
            <SectionHeader title="Appearance" subtitle="Pick the theme that suits your study hours" icon={Palette} />
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
              {THEMES.map(({ value, label, icon: Icon, hint }) => {
                const active = settings.theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => patch('theme', value)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active
                        ? 'border-accent bg-accent-soft ring-1 ring-accent/40'
                        : 'border-line bg-surface-2 hover:border-line-strong'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        active ? 'bg-accent text-white' : 'bg-surface-3 text-ink-2'
                      }`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.85rem] font-bold text-ink">{label}</span>
                      <span className="block truncate text-[0.72rem] text-ink-3">{hint}</span>
                    </span>
                    {active && <Check size={16} className="ml-auto shrink-0 text-accent" />}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Accent color</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Accent color">
                {[['indigo', '#5b5bd6'], ['violet', '#7c3aed'], ['cyan', '#0891b2'], ['emerald', '#059669'], ['rose', '#e11d48']].map(([name, color]) => <button key={name} type="button" aria-label={`${name} accent`} aria-pressed={(settings.accentColor || 'indigo') === name} onClick={() => patch('accentColor', name)} className={`grid h-9 w-9 place-items-center rounded-full border-2 transition ${(settings.accentColor || 'indigo') === name ? 'border-ink scale-105' : 'border-transparent'}`} style={{ background: color }}><span className="sr-only">{name}</span>{(settings.accentColor || 'indigo') === name && <Check size={15} className="text-white"/>}</button>)}
              </div>
            </div>
          </section>

          
          <section className="card p-5">
            <SectionHeader
              title="New task defaults"
              subtitle="Pre-filled every time you open the Add Task form"
              icon={Sliders}
            />
            <div className="-mb-4">
              <Row
                htmlFor="set-category"
                title="Default category"
                description="Used for new tasks unless you change it. This also sets the starting category weight."
              >
                <select
                  id="set-category"
                  className="field !py-2"
                  value={settings.defaultCategory}
                  onChange={(e) => patch('defaultCategory', e.target.value)}
                >
                  {[...CATEGORIES, ...(settings.customCategories || [])].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Row>

              <Row
                title="Reminder on by default"
                description="An active reminder adds +5 to a task's urgency score."
              >
                <div className="sm:flex sm:justify-end">
                  <Switch
                    checked={settings.defaultReminder}
                    onChange={(v) => patch('defaultReminder', v)}
                    label="Reminder on by default"
                  />
                </div>
              </Row>

              <Row htmlFor="set-priority" title="Default priority" description="Choose a starting priority for newly created tasks.">
                <select id="set-priority" className="field !py-2" value={settings.defaultPriority || 'auto'} onChange={(event) => patch('defaultPriority', event.target.value)}>
                  {[['auto', 'Auto detect'], ['urgent', 'Urgent'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low'], ['none', 'None']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Row>

              <Row htmlFor="set-duration" title="Default task duration" description="Used as the first estimate when creating a task.">
                <select id="set-duration" className="field !py-2" value={settings.defaultDuration || 30} onChange={(event) => patch('defaultDuration', Number(event.target.value))}>{[15, 25, 30, 45, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select>
              </Row>

              <Row
                htmlFor="set-offset"
                title="Default reminder time"
                description="How far ahead of the deadline you want to be nudged."
              >
                <select
                  id="set-offset"
                  className="field !py-2"
                  value={settings.defaultReminderOffset}
                  onChange={(e) => patch('defaultReminderOffset', e.target.value)}
                  disabled={!settings.defaultReminder}
                >
                  {REMINDER_OFFSETS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Row>

              <Row
                title="Week starts on Monday"
                description="Affects the calendar grid and your weekly productivity chart."
              >
                <div className="sm:flex sm:justify-end">
                  <Switch
                    checked={settings.weekStartsMonday}
                    onChange={(v) => patch('weekStartsMonday', v)}
                    label="Week starts on Monday"
                  />
                </div>
              </Row>
              <Row title="Auto archive completed work" description="Move completed tasks to Archive seven days after completion."><div className="sm:flex sm:justify-end"><Switch checked={settings.autoArchiveCompleted || false} onChange={(value) => patch('autoArchiveCompleted', value)} label="Auto archive completed tasks" /></div></Row>
              <Row title="Confirm before deleting" description="Ask before moving a task to Trash."><div className="sm:flex sm:justify-end"><Switch checked={settings.confirmBeforeDelete !== false} onChange={(value) => patch('confirmBeforeDelete', value)} label="Confirm before deleting" /></div></Row>
              <Row title="Compact layout" description="Reduce card spacing to show more work at once."><div className="sm:flex sm:justify-end"><Switch checked={settings.compactMode || false} onChange={(value) => patch('compactMode', value)} label="Compact layout" /></div></Row>
              <Row htmlFor="date-format" title="Date format" description="Choose how dates appear across TaskFlow."><select id="date-format" className="field !py-2" value={settings.dateFormat || 'medium'} onChange={(event) => patch('dateFormat', event.target.value)}><option value="medium">Oct 7, 2026</option><option value="numeric">07/10/2026</option><option value="iso">2026-10-07</option></select></Row>
              <Row htmlFor="time-format" title="Time format" description="Choose 12 or 24-hour time."><select id="time-format" className="field !py-2" value={settings.timeFormat || '12h'} onChange={(event) => patch('timeFormat', event.target.value)}><option value="12h">12-hour</option><option value="24h">24-hour</option></select></Row>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Categories</p>
              <p className="mt-1 text-xs text-ink-3">Add your own categories alongside Study, Personal, Project, and Exam Preparation.</p>
              <div className="mt-2 flex gap-2"><label htmlFor="new-category" className="sr-only">New category name</label><input id="new-category" className="field" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addCategory())} placeholder="e.g. Health" maxLength={40}/><button type="button" className="btn btn-primary shrink-0" onClick={addCategory}>Add</button></div>
              <div className="mt-2 flex flex-wrap gap-1.5">{(settings.customCategories || []).map((category) => <button key={category} type="button" className="chip bg-surface-2 text-ink-2" onClick={() => patch('customCategories', settings.customCategories.filter((item) => item !== category))} aria-label={`Remove ${category} category`}>{category}<span aria-hidden="true">×</span></button>)}</div>
            </div>
          </section>

          
          <section className="card p-5">
            <SectionHeader
              title="Notifications"
              subtitle="Reminders always appear in the in-app notification centre"
              icon={BellRing}
            />
            <div className="-mb-4">
              <Row
                title="Browser alerts"
                description="Show desktop notifications for overdue tasks and deadlines landing today."
              >
                <div className="sm:flex sm:justify-end">
                  <Switch
                    checked={settings.browserNotifications}
                    onChange={enableBrowserNotifications}
                    label="Browser alerts"
                  />
                </div>
              </Row>

              <Row
                title="Motivational messages"
                description="Short encouragement lines on the dashboard and after you complete a task."
              >
                <div className="sm:flex sm:justify-end">
                  <Switch
                    checked={settings.motivationalMessages}
                    onChange={(v) => patch('motivationalMessages', v)}
                    label="Motivational messages"
                  />
                </div>
              </Row>
              <Row title="Overdue warnings" description="Keep overdue tasks in the notification center."><div className="sm:flex sm:justify-end"><Switch checked={settings.notificationOverdue !== false} onChange={(value) => patch('notificationOverdue', value)} label="Overdue warnings" /></div></Row>
              <Row title="Upcoming deadlines" description="Show in-app reminders for tasks due soon."><div className="sm:flex sm:justify-end"><Switch checked={settings.notificationUpcoming !== false} onChange={(value) => patch('notificationUpcoming', value)} label="Upcoming deadline notifications" /></div></Row>
              <Row title="Streak nudges" description="Allow a gentle in-app reminder when a daily streak is at risk."><div className="sm:flex sm:justify-end"><Switch checked={settings.notificationStreak || false} onChange={(value) => patch('notificationStreak', value)} label="Streak nudges" /></div></Row>
            </div>
          </section>
        </div>

        
        <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <section className="card p-5">
            <SectionHeader title="Your data" subtitle="Everything lives in this browser" icon={Database} />
            <dl className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Total tasks', value: stats.total },
                { label: 'Completed', value: stats.completed },
                { label: 'Pending', value: stats.pending },
                { label: 'Overdue', value: stats.overdue.length },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-line bg-surface-2 p-3">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-3">{row.label}</dt>
                  <dd className="mt-1 font-display text-[1.4rem] font-extrabold leading-none text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3.5 text-[0.74rem] leading-relaxed text-ink-2">
              TaskFlow stores your tasks in this browser's local storage. Nothing is uploaded anywhere, and clearing
              your browser data will also clear your tasks.
            </p>
          </section>

          <section className="card p-5">
            <SectionHeader title="Reset options" subtitle="Handy while you're exploring the prototype" />
            <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleImport} aria-label="Import TaskFlow JSON backup" />
            <div className="space-y-2.5">
              <button type="button" onClick={handleExport} className="btn btn-ghost w-full !justify-start"><Download size={16} />Export JSON backup</button>
              <button type="button" onClick={() => importRef.current?.click()} className="btn btn-ghost w-full !justify-start"><Upload size={16} />Import JSON backup</button>
              <p className="px-1 text-[0.72rem] text-ink-3">Imported tasks are validated before replacing this workspace.</p>
              <button type="button" onClick={() => setConfirm('reset')} className="btn btn-ghost w-full !justify-start">
                <RotateCcw size={16} />
                Restore sample tasks
              </button>
              <p className="px-1 text-[0.72rem] text-ink-3">
                Replaces your current tasks with the original demo set, so you can see every feature populated again.
              </p>
              <button
                type="button"
                onClick={() => setConfirm('clear')}
                className="btn btn-danger w-full !justify-start"
              >
                <Trash2 size={16} />
                Clear everything
              </button>
              <p className="px-1 text-[0.72rem] text-ink-3">
                Deletes all tasks, notifications, preferences and your profile from this browser.
              </p>
            </div>
          </section>

          <section className="card p-5">
            <SectionHeader title="Keyboard shortcuts" subtitle="Navigate and act without reaching for the mouse" />
            <div className="space-y-2 text-sm text-ink-2">
              {[['Ctrl / ⌘ K', 'Search and commands'], ['N', 'Create a task'], ['E', 'Edit focused task'], ['Delete', 'Move focused task to Trash'], ['Space', 'Complete focused task'], ['G then D', 'Dashboard'], ['G then A', 'All tasks'], ['G then C', 'Calendar'], ['G then B', 'Board'], ['G then I', 'Analytics'], ['G then S', 'Settings']].map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3"><span>{label}</span><kbd className="rounded-md border border-line bg-surface-2 px-2 py-1 text-xs font-semibold text-ink">{key}</kbd></div>)}
            </div>
            <button type="button" className="btn btn-ghost mt-4 w-full" onClick={() => window.dispatchEvent(new Event('taskflow:open-command'))}>Open command palette</button>
          </section>

          <section className="card p-5">
            <SectionHeader title="Privacy and about" subtitle="Your productivity data stays in this browser" />
            <p className="text-sm leading-relaxed text-ink-2">TaskFlow does not send task content or profile details to a server. Sign-in is a local prototype flow. Browser notifications are optional and can be disabled at any time.</p>
            <div className="mt-4 border-t border-line pt-3 text-xs text-ink-3"><p>TaskFlow · Local-first productivity</p><p className="mt-1">Version 1.0 · Built with React and Vite</p></div>
          </section>

          <section className="card border-high/25 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-high/12 text-high">
                <TriangleAlert size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-[0.95rem] font-bold text-ink">Signing out</h2>
                <p className="mt-1 text-[0.76rem] leading-relaxed text-ink-2">
                  Your tasks stay on this device, so you can sign back in with any email and pick up where you left off.
                </p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-ghost mt-3.5 w-full">
              <LogOut size={16} />
              Log out
            </button>
          </section>

          <p className="text-center text-[0.72rem] text-ink-3">
            TaskFlow — Work, in flow.
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          resetData()
          toast('Sample tasks restored', { description: 'Your dashboard, analytics and reminders were rebuilt.' })
        }}
        tone="accent"
        title="Restore sample tasks?"
        message="This replaces your current task list with the original demo data. Any tasks you added yourself will be removed."
        confirmLabel="Restore sample data"
        note="This one cannot be undone, so export anything you need first."
      />

      <ConfirmDialog
        open={confirm === 'clear'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          clearEverything()
          toast('Everything cleared', {
            tone: 'info',
            description: 'Tasks, preferences and your profile were removed from this browser.',
          })
          navigate('/login')
        }}
        title="Clear everything?"
        message="All tasks, notifications, preferences and your profile will be deleted from this browser. This cannot be undone."
        confirmLabel="Clear everything"
        note="There is no undo for this one — you'll be returned to the login screen."
      />
    </div>
  )
}
