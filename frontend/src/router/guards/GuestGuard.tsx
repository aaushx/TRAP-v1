import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()
  
  // If user is already authenticated, redirect them to dashboard 
  // or wherever they came from
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/app/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
