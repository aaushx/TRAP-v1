import { useToastStore, ToastMessage } from '@/store/toast.store'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  // Minimal monochrome indicators inspired by Nothing OS dot matrix / minimal lines
  const getIndicator = (type: ToastMessage['type']) => {
    switch (type) {
      case 'error':
        // Nothing Red dot accent for errors
        return <span className="w-2 h-2 rounded-full bg-error shrink-0" />
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-text-primary shrink-0" />
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
      case 'loading':
        return <Loader className="w-3.5 h-3.5 text-text-secondary animate-spin shrink-0" />
      case 'info':
      default:
        return <span className="w-2 h-2 rounded-full bg-text-tertiary shrink-0" />
    }
  }

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="alert"
            className="flex items-center gap-4 px-4 py-3 bg-bg-surface border border-border-default rounded-md shadow-sm pointer-events-auto w-full select-none"
          >
            {/* Minimal Dot Symbol */}
            {getIndicator(toast.type)}
            
            {/* Text description (monospace accent labels) */}
            <span className="text-xs font-mono font-medium text-text-primary flex-1 tracking-tight">
              {toast.message}
            </span>

            {/* Undo trigger action */}
            {toast.onUndo && (
              <button
                onClick={() => {
                  if (toast.onUndo) toast.onUndo()
                  removeToast(toast.id)
                }}
                className="text-xs font-mono font-bold text-text-primary hover:text-text-secondary underline cursor-pointer pr-1 shrink-0 focus-visible:outline-none"
              >
                UNDO
              </button>
            )}

            {/* Manual Dismiss */}
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer shrink-0 focus-visible:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
