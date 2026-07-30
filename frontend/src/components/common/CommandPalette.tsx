import { useEffect, useState, useRef, useMemo, FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Code2, 
  Building2, 
  Target, 
  Sliders, 
  LogOut, 
  LayoutDashboard,
  ArrowRight,
  FileText
} from 'lucide-react'
import { authApi, SearchResultItem } from '@/services/api/auth'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandAction {
  id: string
  title: string
  category: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  isDangerous?: boolean
}

export const CommandPalette: FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('trap-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  // Save recent search
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('trap-recent-searches', JSON.stringify(updated))
  }

  // Command palette quick actions (Raycast inspired static list)
  const staticActions = useMemo<CommandAction[]>(() => [
    {
      id: 'dashboard',
      title: 'Open Dashboard',
      category: 'Navigation',
      description: 'Go to prep analytics overview',
      icon: LayoutDashboard,
      action: () => { navigate('/app/dashboard'); onClose() }
    },
    {
      id: 'problems',
      title: 'Open Problems Tracker',
      category: 'Navigation',
      description: 'Review and manage your coding problems list',
      icon: Code2,
      action: () => { navigate('/app/problems'); onClose() }
    },
    {
      id: 'companies',
      title: 'Open Company Pipeline',
      category: 'Navigation',
      description: 'Track job applications and pipeline',
      icon: Building2,
      action: () => { navigate('/app/companies'); onClose() }
    },
    {
      id: 'goals',
      title: 'Open Goals',
      category: 'Navigation',
      description: 'Review roadmap goals and learning topics',
      icon: Target,
      action: () => { navigate('/app/goals'); onClose() }
    },
    {
      id: 'settings',
      title: 'Open Settings',
      category: 'System',
      description: 'Update profile, language targets, and security details',
      icon: Sliders,
      action: () => { navigate('/app/settings'); onClose() }
    },
    {
      id: 'create-goal',
      title: 'Create Goal',
      category: 'Actions',
      description: 'Generate a new customized prep roadmap goal',
      icon: Target,
      action: () => { navigate('/app/goals/new'); onClose() }
    },
    {
      id: 'create-problem',
      title: 'Create Problem',
      category: 'Actions',
      description: 'Add a new coding problem entry',
      icon: Code2,
      action: () => { navigate('/app/problems?add=true'); onClose() }
    },
    {
      id: 'create-company',
      title: 'Create Company',
      category: 'Actions',
      description: 'Track a new company application',
      icon: Building2,
      action: () => { navigate('/app/companies?add=true'); onClose() }
    },
    {
      id: 'logout',
      title: 'Log Out',
      category: 'System',
      description: 'Sign out of your TRAP account',
      icon: LogOut,
      action: () => {
        // Trigger a click on the logout confirmation in sidebar or call it
        navigate('/app/dashboard')
        onClose()
        // Dispatch custom logout event to open confirmation in sidebar
        const event = new CustomEvent('trap-trigger-logout')
        window.dispatchEvent(event)
      },
      isDangerous: true
    }
  ], [navigate, onClose])

  // Instant fuzzy query search implementation
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await authApi.searchAll(query)
        setResults(response.data)
      } catch (err: any) {
        console.error('Palette search error', err)
        setError('Search query failed.')
      } finally {
        setIsLoading(false)
      }
    }, 150) // Debounce delay

    return () => clearTimeout(delayDebounce)
  }, [query])

  // Combine actions or results based on query text
  const viewItems = useMemo(() => {
    if (!query.trim()) {
      return staticActions.map(item => ({ ...item, isStatic: true }))
    }
    return results.map(item => ({
      id: `${item.type}-${item.id}`,
      title: item.title,
      category: item.category || item.type.toUpperCase(),
      description: item.description,
      type: item.type,
      url: item.url,
      action: () => {
        saveRecentSearch(query)
        navigate(item.url)
        onClose()
      }
    }))
  }, [query, results, staticActions])

  // Keyboard navigation & Focus management
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        e.preventDefault()
        return
      }

      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % viewItems.length)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + viewItems.length) % viewItems.length)
        e.preventDefault()
      } else if (e.key === 'Enter') {
        if (viewItems[selectedIndex]) {
          viewItems[selectedIndex].action()
        }
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, viewItems, selectedIndex, onClose])

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return
    const activeEl = listEl.querySelector('[data-active="true"]') as HTMLElement
    if (!activeEl) return

    const listHeight = listEl.clientHeight
    const itemTop = activeEl.offsetTop
    const itemHeight = activeEl.clientHeight

    if (itemTop + itemHeight > listEl.scrollTop + listHeight) {
      listEl.scrollTop = itemTop + itemHeight - listHeight
    } else if (itemTop < listEl.scrollTop) {
      listEl.scrollTop = itemTop
    }
  }, [selectedIndex])

  // Match highlight helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => 
      regex.test(part) 
        ? <span key={index} className="bg-white/15 text-text-primary px-0.5 rounded font-bold">{part}</span>
        : part
    )
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'problem': return Code2
      case 'company': return Building2
      case 'goal': return Target
      case 'topic': return FileText
      default: return ArrowRight
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10dvh]">
      {/* Backdrop (Fade transition) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
      />

      {/* Command Box (Nothing monochrome outline panel) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg bg-bg-surface border border-border-default rounded-lg shadow-lg overflow-hidden flex flex-col z-10"
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-default">
          <Search className="w-4 h-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search goals, topics, problems, companies or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0"
            aria-label="Global search input"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-border-subtle text-[10px] font-mono text-text-tertiary rounded uppercase">ESC</kbd>
          </div>
        </div>

        {/* Search results list box */}
        <div 
          ref={listRef}
          className="max-h-[340px] overflow-y-auto divide-y divide-border-default select-none custom-scrollbar"
        >
          {isLoading && (
            <div className="p-8 flex items-center justify-center gap-3 text-xs font-mono text-text-tertiary">
              <span className="w-2 h-2 rounded-full bg-text-tertiary animate-pulse" />
              Searching database...
            </div>
          )}

          {error && (
            <div className="p-6 text-xs text-error font-mono text-center">
              {error}
            </div>
          )}

          {!isLoading && !error && viewItems.length === 0 && (
            <div className="p-8 text-center text-xs font-mono text-text-tertiary">
              No matching results found for "{query}"
            </div>
          )}

          {!isLoading && !error && viewItems.length > 0 && (
            <div className="p-2 space-y-1">
              {viewItems.map((item, index) => {
                const isActive = index === selectedIndex
                const IconComponent = (item as any).isStatic ? (item as any).icon : getItemIcon((item as any).type)
                
                return (
                  <div
                    key={item.id}
                    data-active={isActive}
                    onClick={() => item.action()}
                    className={`
                      flex items-center gap-3.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors
                      ${isActive ? 'bg-white/10' : 'bg-transparent'}
                    `}
                  >
                    {/* Icon */}
                    <div className={`p-1.5 rounded-md ${
                      isActive ? 'bg-white/5 text-text-primary' : 'text-text-secondary'
                    }`}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                    </div>

                    {/* Metadata text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {renderHighlightedText(item.title, query)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-border-subtle rounded text-[9px] font-mono font-bold text-text-tertiary uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5 font-sans leading-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* Quick action button hint */}
                    <span className="text-[10px] font-mono text-text-tertiary uppercase shrink-0">
                      {(item as any).isStatic ? 'Execute' : 'Open'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Palette footer info */}
        <div className="px-4 py-2 bg-white/[0.01] border-t border-border-default flex items-center justify-between text-[10px] font-mono text-text-tertiary uppercase">
          <span>Navigate with keys ↑ ↓</span>
          <span>Select with Enter ↵</span>
        </div>
      </motion.div>
    </div>
  )
}
