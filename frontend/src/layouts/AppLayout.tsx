import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopBar } from '@/components/navigation/TopBar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/services/api/auth'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { CommandPalette } from '@/components/common/CommandPalette'
import { AnimatePresence } from 'framer-motion'

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/problems': 'Problems',
  '/app/companies': 'Companies',
  '/app/goals': 'Goals',
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const location = useLocation()

  // Listen globally to Ctrl + K and /
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl + K
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        setCommandPaletteOpen(prev => !prev)
        e.preventDefault()
      }
      
      // Focus palette on / when not inside inputs/textareas
      if (e.key === '/' && !commandPaletteOpen) {
        const target = e.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
        if (!isInput) {
          setCommandPaletteOpen(true)
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [commandPaletteOpen])

  const { user, setUser } = useAuthStore()

  // Load session user profile info on mount if not loaded
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await authApi.getMe()
        // Extract the user nested under response.data.data or response.data based on API contract
        const userData = (response as any).data?.user ?? (response as any).data ?? response
        setUser(userData)
      } catch (err) {
        console.error('Failed to load user profile in layout', err)
      }
    }
    if (!user) {
      loadProfile()
    }
  }, [user, setUser])

  // Derive page title from current route
  const pageTitle = pageTitles[location.pathname] || 'TRAP'

  // Get user name from auth store (fallback to 'Student')
  const userName = user?.full_name || 'Student'

  return (
    <div className="flex min-h-dvh bg-bg-base">
      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          title={pageTitle}
          userName={userName}
          onMenuToggle={() => setMobileNavOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Catch unexpected layout component crashes gracefully */}
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
