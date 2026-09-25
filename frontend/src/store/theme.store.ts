/**
 * TRAP Theme Store
 * Manages Light, Dark, and System theme modes with:
 * - LocalStorage persistence
 * - Zero-flash DOM class updates
 * - Dynamic OS prefers-color-scheme event handling
 * - Backend user profile synchronization
 */
import { create } from 'zustand'
import { authApi } from '@/services/api/auth'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (mode: ThemeMode) => void
  initializeTheme: () => void
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (resolved === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  // Update browser theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#09090b' : '#fbf9f8')
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Read initially stored theme
  const initialTheme: ThemeMode =
    typeof window !== 'undefined'
      ? ((localStorage.getItem('trap-theme') as ThemeMode) || 'system')
      : 'system'
  const initialResolved = resolveTheme(initialTheme)

  // Listen to OS preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      const currentMode = get().theme
      if (currentMode === 'system') {
        const newResolved = getSystemTheme()
        applyThemeToDOM(newResolved)
        set({ resolvedTheme: newResolved })
      }
    })
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (mode: ThemeMode) => {
      const resolved = resolveTheme(mode)
      applyThemeToDOM(resolved)

      if (typeof window !== 'undefined') {
        localStorage.setItem('trap-theme', mode)
      }

      set({ theme: mode, resolvedTheme: resolved })

      // Background sync to user profile preferences (swallow network errors gracefully)
      authApi.updateProfile({ preferences: { theme: mode } }).catch(() => {
        // Local preference remains applied even if offline or logged out
      })
    },

    initializeTheme: () => {
      const saved =
        typeof window !== 'undefined'
          ? ((localStorage.getItem('trap-theme') as ThemeMode) || 'system')
          : 'system'
      const resolved = resolveTheme(saved)
      applyThemeToDOM(resolved)
      set({ theme: saved, resolvedTheme: resolved })
    },
  }
})
