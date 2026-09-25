import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Code2, Flame, Building2, Clock, Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'

import { StatCard } from '@/components/dashboard/StatCard'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { getDashboardStats, getReadinessStats, DashboardStats, ReadinessStats } from '@/services/api/dashboard'
import { DashboardSkeleton } from '@/components/common/Skeleton'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [readiness, setReadiness] = useState<ReadinessStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        setError(null)
        const [statsData, readinessData] = await Promise.all([
          getDashboardStats(),
          getReadinessStats()
        ])
        setData(statsData)
        setReadiness(readinessData)
      } catch (err) {
        console.error('Failed to load dashboard stats', err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const firstName = data?.user?.full_name?.split(' ')[0] || 'Student'
  
  const pri = readiness?.placement_readiness_index ?? 0
  const remainingHours = readiness?.remaining_study_time ?? 0
  const dailyFocus = readiness?.daily_focus ?? ["Create a Goal to see your focus!"]
  const strengths = readiness?.strengths ?? ["-"]
  const needsImprovement = readiness?.needs_improvement ?? ["-"]

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-secondary mb-4" />
        <h2 className="text-xl font-display font-bold text-primary uppercase tracking-tight mb-2">System Interrupted</h2>
        <p className="text-text-secondary text-sm mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-primary text-text-inverse font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* ── Welcome Header & PRI Gauge ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-tighter">
            Welcome back, {firstName}
          </h1>
          <p className="text-text-secondary text-xs font-mono uppercase tracking-wider mt-1">
            System status: Optimal operation
          </p>
        </div>
        
        {/* Readiness Index Gauge - Minimalist circular chart */}
        <div className="flex items-center gap-3 bg-bg-surface border border-border-default px-4 py-2 rounded-md relative group hover:border-primary transition-colors duration-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          <div className="relative flex items-center justify-center w-12 h-12 mt-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--color-bg-container)"
                strokeWidth="3"
              />
              <circle
                className="transition-all duration-1000 ease-out"
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--color-brand-primary)"
                strokeWidth="3"
                strokeDasharray={`${pri}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-primary">{pri}%</span>
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-primary uppercase tracking-wider">PRI Score</div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider">Placement Readiness</div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Code2 className="w-4 h-4" />}
          label="Problems Solved"
          value={data?.stats?.problems_solved || 0}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={0}
        />
        <StatCard
          icon={<Building2 className="w-4 h-4" />}
          label="Companies Tracked"
          value={data?.stats?.companies_tracked || 0}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={1}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Est. Study Time"
          value={`${remainingHours}h`}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={2}
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Current Streak"
          value={`${data?.stats?.current_streak || 0} days`}
          accentColor="border border-secondary/30 bg-secondary/5 text-secondary"
          index={3}
        />
      </div>

      {/* ── Readiness Insights (Flat Outlines) ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Daily Focus */}
        <div className="bg-bg-surface border border-border-default rounded-md p-5 relative group hover:border-primary transition-colors duration-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
          <div className="flex items-center justify-between mb-4 mt-1 border-b border-border-default border-dashed pb-3">
            <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">Priority Target</h3>
            <Target className="w-4 h-4 text-text-secondary" />
          </div>
          <ul className="space-y-3">
            {dailyFocus.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strengths */}
        <div className="bg-bg-surface border border-border-default rounded-md p-5 relative group hover:border-primary transition-colors duration-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
          <div className="flex items-center justify-between mb-4 mt-1 border-b border-border-default border-dashed pb-3">
            <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">Optimized Areas</h3>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((str, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-success-muted text-success border border-success/20 text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                {str}
              </span>
            ))}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="bg-bg-surface border border-border-default rounded-md p-5 relative group hover:border-primary transition-colors duration-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
          <div className="flex items-center justify-between mb-4 mt-1 border-b border-border-default border-dashed pb-3">
            <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">Deficient Sectors</h3>
            <div className="w-2 h-2 rounded bg-secondary animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {needsImprovement.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-secondary/5 text-secondary border border-secondary/20 text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Content Grid: Heatmap + Sidebar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left: Activity Heatmap (2/3 width) */}
        <div className="lg:col-span-2">
          <ActivityHeatmap data={data?.heatmap_data || {}} />
        </div>

        {/* Right: Recent Activity + Quick Actions (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <RecentActivity items={data?.recent_activity || []} />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
