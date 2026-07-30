import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  onUndo?: () => void
}

interface ToastState {
  toasts: ToastMessage[]
  addToast: (message: string, type?: ToastType, onUndo?: () => void) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success', onUndo) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    // For loading state or undoable actions, we can adjust timing
    const duration = type === 'loading' ? 12000 : 5000
    
    set((state) => ({ toasts: [...state.toasts, { id, message, type, onUndo }] }))
    
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  }
}))
