import { motion } from 'framer-motion'
import { Code2, Building2, Target, Inbox, Info } from 'lucide-react'

interface ActivityItem {
  id: string
  description: string
  timestamp: string
  type: string
}

interface RecentActivityProps {
  items?: ActivityItem[]
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'problem':
      return { icon: <Code2 className="w-3.5 h-3.5" />, color: 'text-primary border border-border-default bg-bg-container-low' }
    case 'company':
      return { icon: <Building2 className="w-3.5 h-3.5" />, color: 'text-primary border border-border-default bg-bg-container-low' }
    case 'goal':
      return { icon: <Target className="w-3.5 h-3.5" />, color: 'text-secondary border border-secondary/20 bg-secondary/5' }
    default:
      return { icon: <Info className="w-3.5 h-3.5" />, color: 'text-text-secondary border border-border-default bg-bg-container-low' }
  }
}

// Format ISO string to "2 hours ago", "1 day ago" etc.
const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  
  return date.toLocaleDateString()
}

export function RecentActivity({ items = [] }: RecentActivityProps) {
  const isEmpty = items.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
      className="surface-card p-5 relative group"
    >
      {/* Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
      
      <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest mb-4 mt-1 border-b border-border-default border-dashed pb-2">
        Operation Logs
      </h3>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-9 h-9 rounded bg-bg-container-low flex items-center justify-center mb-3 border border-border-default">
            <Inbox className="w-4 h-4 text-text-tertiary" />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">No Logs Recorded</p>
          <p className="text-[10px] text-text-tertiary mt-0.5 font-sans">
            Start solving problems to populate.
          </p>
        </div>
      ) : (
        /* Activity List */
        <div className="space-y-0">
          {items.map((item, idx) => {
            const { icon, color } = getIconForType(item.type)
            
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-3 ${
                  idx < items.length - 1 ? 'border-b border-border-subtle' : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded shrink-0 ${color}`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium text-primary truncate uppercase tracking-tight">
                    {item.description}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] font-mono text-text-tertiary whitespace-nowrap shrink-0">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
export default RecentActivity
