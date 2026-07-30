import { FC } from 'react'
import { User } from '@/services/api/auth'
import { 
  Building2, 
  Target, 
  Code2, 
  Flame, 
  GraduationCap, 
  Compass, 
  Layers 
} from 'lucide-react'

interface ProfileCardProps {
  user: User
  stats: {
    problems_solved: number
    goals_completed: number
    companies_applied: number
    current_streak: number
    placement_readiness_index: number
  }
}

export const ProfileCard: FC<ProfileCardProps> = ({ user, stats }) => {
  const userInitial = user.full_name ? user.full_name[0].toUpperCase() : 'S'

  return (
    <div className="bg-white border border-border-default rounded-md p-6 shadow-sm space-y-6 relative group">
      {/* Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
      
      {/* Profile Info Header */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left select-none mt-1">
        {/* Large Monochromatic Avatar */}
        <div className="w-20 h-20 rounded bg-bg-container-high text-primary text-2xl font-mono font-bold flex items-center justify-center border border-border-default shrink-0">
          {userInitial}
        </div>
        
        <div className="space-y-1.5 flex-1 min-w-0">
          <h2 className="text-xl font-bold font-display text-primary tracking-tight uppercase">
            {user.full_name}
          </h2>
          <p className="text-xs text-text-secondary font-mono">
            {user.email}
          </p>

          <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start pt-1.5 text-xs text-text-secondary font-mono font-bold">
            {user.college && (
              <span className="flex items-center gap-1 bg-bg-container-low px-2 py-0.5 border border-border-default rounded">
                <GraduationCap className="w-3.5 h-3.5" />
                {user.college}
              </span>
            )}
            {user.branch && (
              <span className="flex items-center gap-1 bg-bg-container-low px-2 py-0.5 border border-border-default rounded">
                <Layers className="w-3.5 h-3.5" />
                {user.branch}
              </span>
            )}
            {user.grad_year && (
              <span className="flex items-center gap-1 bg-bg-container-low px-2 py-0.5 border border-border-default rounded">
                Class of {user.grad_year}
              </span>
            )}
          </div>
        </div>

        {/* PRI score badge */}
        <div className="flex flex-col items-center justify-center bg-bg-container-low border border-border-default px-4 py-3 rounded text-center min-w-[100px] shrink-0">
          <span className="text-[10px] font-mono font-bold text-text-tertiary uppercase block tracking-wider">PRI Score</span>
          <span className="text-2xl font-mono font-bold text-primary mt-1">
            {stats.placement_readiness_index}%
          </span>
        </div>
      </div>

      {/* Structured metrics section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-default border-dashed">
        {/* Problems Solved */}
        <div className="bg-bg-container-low border border-border-default rounded p-4 flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Solved</span>
            <Code2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-bold text-primary">
              {stats.problems_solved}
            </span>
            <span className="text-[9px] text-text-secondary font-mono block mt-0.5 uppercase tracking-wide">Problems</span>
          </div>
        </div>

        {/* Goals Completed */}
        <div className="bg-bg-container-low border border-border-default rounded p-4 flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Completed</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-bold text-primary">
              {stats.goals_completed}
            </span>
            <span className="text-[9px] text-text-secondary font-mono block mt-0.5 uppercase tracking-wide">Roadmaps</span>
          </div>
        </div>

        {/* Companies Applied */}
        <div className="bg-bg-container-low border border-border-default rounded p-4 flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Applied</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-bold text-primary">
              {stats.companies_applied}
            </span>
            <span className="text-[9px] text-text-secondary font-mono block mt-0.5 uppercase tracking-wide">Companies</span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-bg-container-low border border-secondary/20 rounded p-4 flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-mono font-bold text-secondary">
              {stats.current_streak}
            </span>
            <span className="text-[9px] text-secondary font-mono block mt-0.5 uppercase tracking-wide">Active Days</span>
          </div>
        </div>
      </div>

      {/* Target details list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-bg-container-low/45 border border-border-default rounded p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wide">Target Role</span>
            <p className="text-xs font-mono font-bold text-primary uppercase">
              {user.target_role || 'Not specified'}
            </p>
          </div>
          <Compass className="w-4 h-4 text-text-tertiary" />
        </div>
        <div className="bg-bg-container-low/45 border border-border-default rounded p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wide">Preferred Language</span>
            <p className="text-xs font-mono font-bold text-primary uppercase">
              {user.preferred_language || 'Not specified'}
            </p>
          </div>
          <Code2 className="w-4 h-4 text-text-tertiary" />
        </div>
      </div>
    </div>
  )
}
export default ProfileCard
