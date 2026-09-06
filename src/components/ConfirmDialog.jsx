import { Trash2, TriangleAlert } from 'lucide-react'
import { Modal } from './Modal.jsx'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  highlight,
  confirmLabel = 'Delete task',
  cancelLabel = 'Cancel',
  tone = 'danger',
  note = 'This action can be undone from the toast that appears next.',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      icon={
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            tone === 'danger' ? 'bg-high/12 text-high' : 'bg-accent-soft text-accent'
          }`}
        >
          <TriangleAlert size={19} />
        </div>
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            className={`btn w-full sm:w-auto ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
          >
            {tone === 'danger' && <Trash2 size={16} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{message}</p>
      {highlight && (
        <p className="mt-3 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm font-semibold text-ink">
          {highlight}
        </p>
      )}
      {note && <p className="mt-3 text-[0.76rem] text-ink-3">{note}</p>}
    </Modal>
  )
}
