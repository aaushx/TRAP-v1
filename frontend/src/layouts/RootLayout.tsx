import { Outlet } from 'react-router-dom'
import { ToastContainer } from '@/components/common/ToastContainer'

/**
 * Root layout wraps the entire application.
 * Place global providers like Toast, Modals here that should be
 * accessible from both authenticated and unauthenticated pages.
 */
export function RootLayout() {
  return (
    <div className="min-h-dvh bg-bg-base text-text-primary antialiased">
      <Outlet />
      <ToastContainer />
    </div>
  )
}
