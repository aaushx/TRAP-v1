import { motion } from 'framer-motion'
import { Plus, Building2, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuickAction {
  label: string
  icon: React.ReactNode
  path: string
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Add Problem',
    icon: <Plus className="w-4 h-4" />,
    path: '/app/problems'
  },
  {
    label: 'Track Company',
    icon: <Building2 className="w-4 h-4" />,
    path: '/app/companies'
  },
  {
    label: "View Goals",
    icon: <Target className="w-4 h-4" />,
    path: '/app/goals'
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1, ease: 'easeOut' }}
      className="surface-card p-5 relative group"
    >
      {/* Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
      
      <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest mb-4 mt-1 border-b border-border-default border-dashed pb-2">
        Execution Console
      </h3>

      <div className="flex flex-col gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.path)}
            className="
              w-full flex items-center gap-3 p-3.5
              bg-bg-container-low hover:bg-bg-container-high
              border border-border-default rounded-md
              transition-all duration-200 ease-out
              group cursor-pointer hover:border-primary
            "
          >
            <span className="text-primary border border-border-default p-1 bg-white rounded">
              {action.icon}
            </span>
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
export default QuickActions
