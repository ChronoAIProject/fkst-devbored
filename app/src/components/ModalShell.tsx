import { useEffect, useRef, type ReactNode } from 'react'

import { CloseIcon } from './Icons'

interface ModalShellProps {
  title: string
  label: string
  children: ReactNode
  onClose: () => void
  width?: 'default' | 'wide'
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function visibleFocusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.getClientRects().length > 0)
}

export function ModalShell({ title, label, children, onClose, width = 'default' }: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Capture during render, before the dialog commit can honor a descendant's autoFocus.
  const restoreFocusRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      const restoreTarget = restoreFocusRef.current
      window.queueMicrotask(() => {
        if (restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true })
      })
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
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = visibleFocusableElements(event.currentTarget)
        const first = focusable.at(0)
        const last = focusable.at(-1)
        if (!first || !last) return
        if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
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
