import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { sidebarNavItems } from './Sidebar'

// ── Props ────────────────────────────────────────────────────────────
interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

// ── Component ────────────────────────────────────────────────────────
export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Lock body scroll when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* ── Overlay ──────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-0 z-[300] bg-black/60
          transition-opacity duration-300
          md:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer ───────────────────────────────────────────── */}
      <nav
        className={`
          fixed top-0 left-0 bottom-0 z-[300]
          w-[280px] flex flex-col
          bg-bg-surface border-r border-border-default
          transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="TRA.P Logo" className="w-8 h-8 rounded" />
            <span className="font-display font-bold text-lg tracking-tighter text-primary uppercase">
              TRA.P
            </span>
          </div>

          <button
            onClick={onClose}
            className="
              flex items-center justify-center
              w-9 h-9 rounded-lg
              text-text-secondary hover:text-primary hover:bg-bg-container-low
              transition-colors duration-200
            "
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Nav items ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-1 px-3 mt-4 overflow-y-auto">
          {sidebarNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `
                group relative flex items-center gap-3 rounded-md
                px-3 py-2.5 text-sm font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-bg-container-high text-primary border-l-2 border-primary pl-2.5 font-semibold'
                    : 'text-text-secondary hover:bg-bg-container-low hover:text-primary'
                }
                `
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
