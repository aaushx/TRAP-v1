import { FC } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  supportEmail?: string
}

export const ErrorState: FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'An unexpected server or network error occurred. Please try again.',
  onRetry,
  supportEmail = 'support@trapapp.com'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-bg-surface border border-border-default rounded-lg text-center max-w-md mx-auto my-12 select-none">
      {/* Red Dot/Indicator Accent for Alerts */}
      <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-4 shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
      
      {/* Headline */}
      <h2 className="text-base font-mono font-bold text-text-primary uppercase tracking-wider mb-2">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-xs text-text-secondary font-sans leading-relaxed mb-6">
        {description}
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-center mb-6">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-text-primary hover:bg-text-secondary text-bg-base text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer focus:outline-none"
          >
            Retry Action
          </button>
        )}
        <button
          onClick={() => { window.location.href = '/app/dashboard' }}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-text-primary border border-border-default text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer focus:outline-none"
        >
          Go Home
        </button>
      </div>

      {/* Support Message */}
      <div className="pt-4 border-t border-border-default w-full">
        <span className="text-[10px] text-text-tertiary tracking-tight font-mono uppercase block">
          Need help? Contact support at
        </span>
        <a 
          href={`mailto:${supportEmail}`}
          className="text-xs text-text-secondary hover:text-text-primary font-sans transition-colors mt-1 inline-block"
        >
          {supportEmail}
        </a>
      </div>
    </div>
  )
}
