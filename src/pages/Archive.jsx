import { useState } from 'react'
import { ArchiveRestore, RotateCcw, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { useApp } from '../store/AppStore.jsx'

export function Archive() {
  const { archivedTasks, trashTasks, archiveTask, restoreDeletedTask, deleteTask, deleteForever, toast } = useApp()
  const [tab, setTab] = useState('archive')
  const [pending, setPending] = useState(null)
  const items = tab === 'archive' ? archivedTasks : trashTasks

  const restore = (task) => {
    if (tab === 'archive') archiveTask(task.id, false)
    else restoreDeletedTask(task.id)
    toast('Task restored', { description: `“${task.title}” is available again.` })
  }

  return <div className="space-y-5">
    <PageHeader icon={ArchiveRestore} eyebrow="Storage" title="Archive & trash" subtitle="Keep completed or removed work out of your active workspace, and restore it whenever you need." />
    <div className="flex gap-2" role="tablist" aria-label="Archived and deleted tasks">{[['archive', `Archive · ${archivedTasks.length}`], ['trash', `Trash · ${trashTasks.length}`]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>)}</div>
    {!items.length ? <EmptyState icon={tab === 'archive' ? ArchiveRestore : Trash2} title={tab === 'archive' ? 'Your archive is clear' : 'Trash is empty'} message={tab === 'archive' ? 'Archived tasks will appear here for easy recovery.' : 'Deleted tasks stay here until you permanently remove them.'} /> : <ul className="space-y-2.5">{items.map((task) => <li key={task.id} className="card flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><h2 className="truncate font-display font-bold text-ink">{task.title}</h2><p className="mt-0.5 line-clamp-1 text-sm text-ink-2">{task.description || task.category}</p><p className="mt-1 text-xs text-ink-3">{task.category} · {task.completed ? 'Completed' : (task.status || 'To do').replace('-', ' ')}</p></div><button type="button" className="btn btn-ghost" onClick={() => restore(task)}><RotateCcw size={15}/>Restore</button>{tab === 'archive' && <button type="button" className="btn btn-ghost text-high" onClick={() => setPending(task)}><Trash2 size={15}/>Move to trash</button>}{tab === 'trash' && <button type="button" className="btn btn-danger" onClick={() => setPending(task)}><Trash2 size={15}/>Delete forever</button>}</li>)}</ul>}
    <ConfirmDialog open={Boolean(pending)} onClose={() => setPending(null)} onConfirm={() => { if (pending) { if (tab === 'archive') { deleteTask(pending.id); toast('Task moved to trash', { tone: 'info', description: pending.title }) } else { deleteForever(pending.id); toast('Task permanently deleted', { tone: 'info', description: pending.title }) } } }} title={tab === 'archive' ? 'Move task to trash?' : 'Delete permanently?'} message={tab === 'archive' ? 'You can restore this task from Trash later.' : 'This task will be removed from this browser and cannot be restored.'} highlight={pending?.title} confirmLabel={tab === 'archive' ? 'Move to trash' : 'Delete forever'} note={tab === 'archive' ? 'The task remains restorable from Trash.' : 'Export a backup before permanently removing important work.'} />
  </div>
}
