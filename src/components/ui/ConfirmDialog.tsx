import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Delete',
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
        {message}
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
