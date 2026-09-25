import { Search, Menu } from 'lucide-react'

// ── Props ────────────────────────────────────────────────────────────
interface TopBarProps {
  title: string
  userName: string
  onMenuToggle?: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Component ────────────────────────────────────────────────────────
export function TopBar({ title, userName, onMenuToggle }: TopBarProps) {
  const firstName = userName.split(' ')[0]

  return (
    <header
      className="
        sticky top-0 z-[200]
        flex items-center gap-4
        h-14 px-4 md:px-6
        border-b border-border-default
        bg-bg-surface/80 backdrop-blur-md
      "
    >
      {/* ── Mobile hamburger (md:hidden) ───────────────────────── */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="
            md:hidden flex items-center justify-center
            w-9 h-9 rounded-lg
            text-text-secondary hover:text-text-primary hover:bg-bg-container-high
            transition-colors duration-200
          "
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* ── Page title ─────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">
        {title}
      </h1>

      {/* ── Search bar (center) ────────────────────────────────── */}
      <div className="hidden sm:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search problems, companies..."
            className="
              w-full h-9 pl-9 pr-4
              bg-bg-container-low border border-border-default rounded-md
              text-sm text-primary placeholder:text-text-tertiary
              focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
              transition-colors duration-200
            "
          />
        </div>
      </div>

      {/* ── Greeting & date (right) ────────────────────────────── */}
      <div className="hidden md:flex flex-col items-end shrink-0 ml-auto">
        <span className="text-sm text-text-primary font-medium">
          {getGreeting()}, {firstName}
        </span>
        <span className="text-xs text-text-tertiary">
          {getFormattedDate()}
        </span>
      </div>
    </header>
  )
}
