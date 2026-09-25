import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoalStore } from '@/store/goal.store'
import { Target, Plus, ChevronRight } from 'lucide-react'
import { GoalCardsSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { motion } from 'framer-motion'

export default function GoalsPage() {
  const { goals, fetchGoals, isLoading, error } = useGoalStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Target className="w-6 h-6 text-text-primary" />
            Your Goals
          </h1>
          <p className="text-text-secondary mt-1 text-xs">
            Track your personalized placement preparation journey
          </p>
        </div>
        <Link
          to="/app/goals/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-text-inverse rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-md text-xs font-mono border border-error/20">
          {error}
        </div>
      )}

      {/* Main Grid area */}
      {isLoading ? (
        <GoalCardsSkeleton />
      ) : goals.length === 0 ? (
        <EmptyState
          title="No goals generated"
          description="Generate your first personalized placement roadmap tailored to your target engineering roles and companies."
          actionLabel="Generate Goal"
          onAction={() => navigate('/app/goals/new')}
          iconType="goals"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              to={`/app/goals/${goal.id}`}
              className="group flex flex-col p-5 bg-bg-surface border border-border-default hover:border-primary rounded-md transition-all relative"
            >
              {/* Top Stripe Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
              
              <div className="flex justify-between items-start mb-4 mt-1">
                <div className="space-y-1">
                  <h3 className="font-bold font-display text-base text-primary group-hover:text-text-secondary transition-colors line-clamp-1 uppercase">
                    {goal.title}
                  </h3>
                  <p className="text-[10px] text-text-secondary font-mono font-bold uppercase tracking-wider">
                    {goal.target_role}
                  </p>
                </div>
                <div className="w-7 h-7 rounded bg-bg-container-low border border-border-default flex items-center justify-center group-hover:bg-bg-container-high transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-primary" />
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {goal.target_companies.slice(0, 3).map((company, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-[9px] font-mono font-bold bg-bg-container-low border border-border-default text-text-secondary rounded uppercase tracking-wider">
                      {company}
                    </span>
                  ))}
                  {goal.target_companies.length > 3 && (
                    <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-bg-container-low border border-border-default text-text-secondary rounded uppercase tracking-wider">
                      +{goal.target_companies.length - 3}
                    </span>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-text-secondary font-mono font-bold uppercase tracking-wider">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-container-low rounded overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}
