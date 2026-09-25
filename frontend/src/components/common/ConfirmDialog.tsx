import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false
}: ConfirmDialogProps) {

  // Accessibility: Keyboard trap & Escape closer
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const dialog = document.getElementById('confirm-dialog')
        if (!dialog) return
        
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    // Auto-focus the cancel button initially (for safety/destructive protection)
    const dialog = document.getElementById('confirm-dialog')
    const cancelButton = dialog?.querySelector<HTMLButtonElement>('[data-action="cancel"]')
    if (cancelButton) {
      cancelButton.focus()
    }

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop (Backdrop blur + dark opacity) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      
      {/* Dialog box (Nothing-inspired monochrome style) */}
      <motion.div
        id="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-bg-overlay border border-border-default rounded-md p-6 shadow-sm overflow-hidden z-10"
      >
        <div className="flex items-start gap-4">
          {/* Destructive red vs warning yellow monochrome badge */}
          <div 
            className={`flex items-center justify-center w-10 h-10 rounded shrink-0 ${
              isDangerous ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 
              id="dialog-title" 
              className="text-lg font-bold text-text-primary tracking-tight font-sans"
            >
              {title}
            </h3>
            <p 
              id="dialog-desc" 
              className="text-sm text-text-secondary leading-relaxed font-sans"
            >
              {message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-container-high transition-colors focus-visible:ring-1 focus-visible:ring-text-primary focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Buttons (Keyboard accessible, visible rings, monochrome text-inverse hover state) */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            data-action="cancel"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-bg-container-low hover:bg-bg-container-high text-primary border border-border-default rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-primary focus:outline-none ${
              isDangerous 
                ? 'bg-secondary text-white hover:bg-secondary/90' 
                : 'bg-primary text-text-inverse hover:bg-primary/90'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
