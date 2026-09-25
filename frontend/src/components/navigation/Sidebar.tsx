import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Code2,
  Building2,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sliders,
  BookOpen
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>
}

export const sidebarNavItems: NavItem[] = [
  { label: 'Dashboard',        path: '/app/dashboard',   icon: LayoutDashboard },
  { label: 'Analytics',        path: '/app/analytics',   icon: BarChart3 },
  { label: 'Problems',         path: '/app/problems',    icon: Code2 },
  { label: 'Companies',        path: '/app/companies',   icon: Building2 },
  { label: 'Company Wise DSA', path: '/app/company-dsa', icon: BookOpen },
  { label: 'Goals',            path: '/app/goals',       icon: Target },
  { label: 'Profile',          path: '/app/profile',     icon: User },
  { label: 'Settings',         path: '/app/settings',    icon: Sliders },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  const userName = user?.full_name || 'Student'
  const userInitial = user?.full_name ? user.full_name[0].toUpperCase() : 'S'

  useEffect(() => {
    const handleTriggerLogout = () => {
      setIsLogoutConfirmOpen(true)
    }
    window.addEventListener('trap-trigger-logout', handleTriggerLogout)
    return () => window.removeEventListener('trap-trigger-logout', handleTriggerLogout)
  }, [])

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true)
  }

  const handleConfirmLogout = () => {
    logout()
    setIsLogoutConfirmOpen(false)
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col
        border-r border-border-default bg-bg-surface
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
      `}
      style={{ minHeight: '100dvh' }}
    >
      {/* ── Brand (Official Logo) ──────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-border-subtle">
        <img src="/logo.jpg" alt="TRA.P Logo" className="w-8 h-8 rounded" />
        <span
          className={`
            font-display font-bold text-lg tracking-tighter text-primary uppercase
            transition-opacity duration-200
            ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
          `}
        >
          TRA.P
        </span>
      </div>

      {/* ── Navigation (No gradients, monochrome active state) ───── */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {sidebarNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `
              group relative flex items-center gap-3 rounded-md
              px-3 py-2.5 text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-bg-container-high text-primary border-l-2 border-primary pl-2.5 font-semibold'
                  : 'text-text-secondary hover:bg-bg-container-low hover:text-primary'
              }
              `
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />

            <span
              className={`
                whitespace-nowrap transition-opacity duration-200
                ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
              `}
            >
              {item.label}
            </span>
          </NavLink>
        ))}

        {/* ── Collapse toggle ────────────────────────────────── */}
        <button
          onClick={onToggle}
          className="
            mt-auto flex items-center justify-center
            rounded-lg p-2.5
            text-text-tertiary hover:text-primary hover:bg-bg-container-low
            transition-colors duration-150 cursor-pointer
          "
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </nav>

      {/* ── User section (Dynamic name, confirmed logout) ───────── */}
      <div className="border-t border-border-default px-3 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center justify-center w-9 h-9 rounded bg-bg-container-high text-primary text-xs font-mono font-bold shrink-0">
            {userInitial}
          </div>

          {/* Name & logout */}
          <div
            className={`
              flex-1 flex items-center justify-between
              transition-opacity duration-200 min-w-0
              ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}
          >
            <span className="text-xs font-semibold text-primary truncate mr-2">
              {userName}
            </span>

            <button
              onClick={handleLogoutClick}
              className="
                p-1.5 rounded-md cursor-pointer
                text-text-tertiary hover:text-secondary hover:bg-secondary/10
                transition-colors duration-150
              "
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reusable Confirm Dialog for Logout */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Log Out Session"
        message="Are you sure you want to end your active session and log out of TRA.P? You will need to enter credentials to sign back in."
        confirmText="Confirm Log Out"
        cancelText="Cancel"
      />
    </aside>
  )
}
