import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: { value: number; isPositive: boolean }
  accentColor?: string
  index?: number
}

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  accentColor = 'border border-border-default bg-bg-container-low text-primary',
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.04,
        ease: 'easeOut',
      }}
      className="
        bg-bg-overlay border border-border-default rounded-md p-5
        transition-all duration-200 ease-out
        hover:border-primary hover:-translate-y-0.5
        group relative
      "
    >
      {/* Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
      
      {/* Header: Icon + Trend */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <div className={`flex items-center justify-center w-9 h-9 rounded ${accentColor}`}>
          {icon}
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
              trend.isPositive
                ? 'text-success bg-success-muted border-success/30'
                : 'text-error bg-error-muted border-error/30'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-display font-bold text-primary tracking-tight">
        {value}
      </p>

      {/* Label */}
      <p className="text-xs font-mono font-bold text-text-secondary uppercase tracking-wider mt-1.5">{label}</p>

      {/* Optional Subtitle */}
      {subtitle && (
        <p className="text-xs text-text-tertiary mt-1 font-sans">{subtitle}</p>
      )}
    </motion.div>
  )
}
