import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarDays, Command, Focus, LayoutDashboard, ListChecks, Moon, Plus, Search, Settings, Sparkles, Sun, Workflow } from 'lucide-react'
import { Modal } from './Modal.jsx'
import { useApp } from '../store/AppStore.jsx'
import { useTaskUI } from '../store/TaskUI.jsx'
import { analyze } from '../lib/priority.js'

const PAGE_COMMANDS = [
  { label: 'Open dashboard', to: '/dashboard', icon: LayoutDashboard, keywords: 'home' },
  { label: 'Open all tasks', to: '/tasks', icon: ListChecks, keywords: 'inbox list' },
  { label: 'Open calendar', to: '/calendar', icon: CalendarDays, keywords: 'deadlines upcoming' },
  { label: 'Open task board', to: '/board', icon: Workflow, keywords: 'kanban workflow' },
  { label: 'Open analytics', to: '/analytics', icon: Activity, keywords: 'insights' },
  { label: 'Open focus mode', to: '/focus', icon: Focus, keywords: 'timer pomodoro' },
  { label: 'Open smart priority', to: '/priority', icon: Sparkles, keywords: 'recommendation' },
  { label: 'Open notifications', to: '/notifications', icon: Bell, keywords: 'alerts' },
  { label: 'Open settings', to: '/settings', icon: Settings, keywords: 'preferences' },
]

export function CommandPalette() {
  const { tasks, settings, setSettings } = useApp()
  const { openAdd, openDetail, openEdit, askDelete, toggle } = useTaskUI()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taskflow:recent-searches') || '[]') } catch { return [] }
  })
  const navigate = useNavigate()

  useEffect(() => {
    let chord = false
    let timeout
    const onKey = (event) => {
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        return
      }
      if (event.key === 'Escape') { setOpen(false); chord = false; return }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      const taskCard = document.activeElement?.closest?.('[data-task-id]')
      const selectedTask = taskCard && tasks.find((task) => task.id === taskCard.dataset.taskId)
      if (selectedTask && ['e', 'delete', 'backspace', ' '].includes(event.key.toLowerCase())) {
        event.preventDefault()
        if (event.key.toLowerCase() === 'e') openEdit(selectedTask)
        else if (event.key.toLowerCase() === 'delete' || event.key.toLowerCase() === 'backspace') askDelete(selectedTask)
        else toggle(selectedTask)
        return
      }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); openAdd(); return }
      if (event.key === '/' ) { event.preventDefault(); setOpen(true); return }
      if (chord) {
        const paths = { d: '/dashboard', a: '/tasks', c: '/calendar', b: '/board', i: '/analytics', s: '/settings', f: '/focus' }
        if (paths[event.key.toLowerCase()]) navigate(paths[event.key.toLowerCase()])
        chord = false
        return
      }
      if (event.key.toLowerCase() === 'g') {
        chord = true
        window.clearTimeout(timeout)
        timeout = window.setTimeout(() => { chord = false }, 900)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('taskflow:open-command', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('taskflow:open-command', onOpen); window.clearTimeout(timeout) }
  }, [navigate, openAdd, tasks, openEdit, askDelete, toggle])

  useEffect(() => { if (open) setQuery('') }, [open])

  const entries = useMemo(() => {
    const term = query.trim().toLowerCase()
    const commands = [
      { label: 'Add a task', icon: Plus, action: openAdd, keywords: 'create new' },
      ...PAGE_COMMANDS.map((command) => ({ ...command, action: () => navigate(command.to) })),
      { label: settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: settings.theme === 'dark' ? Sun : Moon, action: () => setSettings((value) => ({ ...value, theme: value.theme === 'dark' ? 'light' : 'dark' })), keywords: 'appearance theme' },
      { label: 'Show overdue tasks', icon: Bell, action: () => navigate('/tasks?filter=overdue'), keywords: 'late deadlines' },
      { label: "Show today's tasks", icon: CalendarDays, action: () => navigate('/tasks?filter=today'), keywords: 'due today' },
    ]
    const taskItems = term ? tasks.filter((task) => `${task.title} ${task.description} ${task.category} ${(task.tags || []).join(' ')}`.toLowerCase().includes(term)).slice(0, 6).map((task) => ({ label: task.title, detail: `${task.category} · ${analyze(task).priority} priority`, icon: ListChecks, action: () => openDetail(task) })) : []
    const matching = term ? commands.filter((item) => `${item.label} ${item.keywords || ''}`.toLowerCase().includes(term)) : commands.slice(0, 5)
    const recentItems = !term ? recent.map((item) => ({ label: `Search “${item}”`, icon: Search, action: () => navigate(`/tasks?q=${encodeURIComponent(item)}`) })) : []
    return [...taskItems, ...matching, ...recentItems].slice(0, 12)
  }, [query, tasks, recent, settings.theme, setSettings, navigate, openAdd, openDetail])

  const run = (entry) => {
    if (query.trim()) {
      const next = [query.trim(), ...recent.filter((item) => item !== query.trim())].slice(0, 6)
      setRecent(next)
      localStorage.setItem('taskflow:recent-searches', JSON.stringify(next))
    }
    setOpen(false)
    entry.action()
  }

  return <Modal open={open} onClose={() => setOpen(false)} title="Search or jump to…" description="Search tasks, switch pages, or run an action." size="lg" icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><Command size={18}/></span>}>
    <label className="sr-only" htmlFor="command-search">Search tasks and commands</label>
    <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"/><input id="command-search" data-autofocus autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a task, page, or command…" className="field pl-10" /></div>
    <div className="mt-3 max-h-[50dvh] space-y-1 overflow-y-auto">{entries.length ? entries.map((entry, index) => { const Icon = entry.icon; return <button type="button" key={`${entry.label}-${index}`} onClick={() => run(entry)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2"><Icon size={17}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{entry.label}</span>{entry.detail && <span className="block text-xs text-ink-3">{entry.detail}</span>}</span><kbd className="hidden text-[0.65rem] text-ink-3 sm:block">↵</kbd></button>}) : <p className="px-3 py-8 text-center text-sm text-ink-2">No matching task or command.</p>}</div>
    <p className="mt-3 border-t border-line pt-3 text-[0.7rem] text-ink-3">Shortcuts: <kbd>⌘/Ctrl K</kbd> search · <kbd>N</kbd> new task · <kbd>G</kbd> then a page key to navigate</p>
  </Modal>
}
