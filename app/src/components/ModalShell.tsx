import { useEffect, useRef, type ReactNode } from 'react'

import { CloseIcon } from './Icons'

interface ModalShellProps {
  title: string
  label: string
  children: ReactNode
  onClose: () => void
  width?: 'default' | 'wide'
}

export function ModalShell({ title, label, children, onClose, width = 'default' }: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${width === 'wide' ? 'modal--wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="modal__sheet">
        <header className="modal__header">
          <div className="modal__heading">
            <span className="eyebrow">{label}</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" autoFocus>
            <CloseIcon />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
