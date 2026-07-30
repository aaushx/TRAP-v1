import { FC } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  iconType?: 'goals' | 'problems' | 'companies' | 'analytics' | 'search'
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  iconType = 'search'
}) => {
  
  // Custom monochrome SVGs mimicking Nothing OS minimal technical outline styles
  const renderIllustration = () => {
    switch (iconType) {
      case 'goals':
        return (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-text-secondary" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="24" r="20" />
            <circle cx="24" cy="24" r="14" />
            <circle cx="24" cy="24" r="8" />
            <circle cx="24" cy="24" r="2" />
          </svg>
        )
      case 'problems':
        return (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-text-secondary" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 4 24 16 30" />
            <polyline points="32 18 44 24 32 30" />
            <line x1="28" y1="10" x2="20" y2="38" />
          </svg>
        )
      case 'companies':
        return (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-text-secondary" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="36" height="36" rx="2" />
            <line x1="16" y1="6" x2="16" y2="42" />
            <line x1="32" y1="6" x2="32" y2="42" />
            <line x1="6" y1="18" x2="42" y2="18" />
            <line x1="6" y1="30" x2="42" y2="30" />
          </svg>
        )
      case 'analytics':
        return (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-text-secondary" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="42" x2="42" y2="42" />
            <polyline points="6 34 18 22 30 28 42 12" />
            <circle cx="18" cy="22" r="1.5" className="fill-current" />
            <circle cx="30" cy="28" r="1.5" className="fill-current" />
            <circle cx="42" cy="12" r="1.5" className="fill-current" />
          </svg>
        )
      case 'search':
      default:
        return (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-text-secondary" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="20" r="12" />
            <line x1="38" y1="38" x2="29" y2="29" />
            <line x1="14" y1="20" x2="26" y2="20" />
          </svg>
        )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-bg-surface border border-border-default rounded-lg text-center select-none max-w-lg mx-auto my-6">
      {/* Monochrome Outline Symbol */}
      <div className="mb-5 flex items-center justify-center">
        {renderIllustration()}
      </div>
      
      {/* Title */}
      <h3 className="text-base font-mono font-bold text-text-primary uppercase tracking-wider mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-xs text-text-secondary font-sans leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      
      {/* Call to Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-text-primary hover:bg-text-secondary text-bg-base text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-text-primary focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
