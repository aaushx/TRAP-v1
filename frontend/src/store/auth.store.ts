import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/services/api/auth'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  user: User | null
  setTokens: (accessToken: string, refreshToken: string, user?: User | null) => void
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
      setTokens: (accessToken, refreshToken, user = null) =>
        set({ accessToken, refreshToken, isAuthenticated: true, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, isAuthenticated: false, user: null }),
    }),
    {
      name: 'trap-auth-storage',
    }
  )
)
