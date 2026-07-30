import { FC } from 'react'

interface BaseSkeletonProps {
  className?: string
}

export const Skeleton: FC<BaseSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white/5 animate-pulse rounded ${className}`} />
  )
}

// ── Dashboard Layout Skeleton ───────────────────────────────────────
export const DashboardSkeleton: FC = () => {
  return (
    <div className="space-y-6 pb-10 animate-pulse">
      {/* Welcome Header */}
      <div className="flex justify-between items-center h-12">
        <div className="w-1/3 h-7 bg-white/5 rounded-md" />
        <div className="w-40 h-10 bg-white/5 rounded-lg" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-5 h-[116px] flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-20 h-4 bg-white/5 rounded" />
              <div className="w-16 h-7 bg-white/5 rounded" />
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-5 h-36 space-y-3">
            <div className="w-1/3 h-5 bg-white/5 rounded" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-white/5 rounded" />
              <div className="w-5/6 h-4 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap & Activity Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-surface border border-border-default rounded-xl h-64 p-5 space-y-4">
          <div className="w-24 h-5 bg-white/5 rounded" />
          <div className="w-full h-40 bg-white/5 rounded-lg" />
        </div>
        <div className="lg:col-span-1 bg-bg-surface border border-border-default rounded-xl h-64 p-5 space-y-4">
          <div className="w-32 h-5 bg-white/5 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-white/5" />
                <div className="flex-1 h-4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Goal Card Grid Skeleton ──────────────────────────────────────────
export const GoalCardsSkeleton: FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-bg-surface border border-border-default rounded-xl p-5 h-52 flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-2/3 h-5 bg-white/5 rounded" />
            <div className="w-1/2 h-4 bg-white/5 rounded" />
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between">
              <div className="w-12 h-3.5 bg-white/5 rounded" />
              <div className="w-8 h-3.5 bg-white/5 rounded" />
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Problems Table Skeleton ──────────────────────────────────────────
export const ProblemsSkeleton: FC = () => {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden divide-y divide-border-default animate-pulse">
      <div className="p-4 bg-white/[0.02] flex items-center justify-between">
        <div className="w-6 h-6 bg-white/5 rounded" />
        <div className="w-24 h-4 bg-white/5 rounded" />
        <div className="w-16 h-4 bg-white/5 rounded" />
        <div className="w-20 h-4 bg-white/5 rounded" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-5 flex items-center gap-6">
          <div className="w-4.5 h-4.5 bg-white/5 rounded" />
          <div className="w-5 h-5 bg-white/5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-5 bg-white/5 rounded" />
            <div className="w-1/4 h-3.5 bg-white/5 rounded" />
          </div>
          <div className="w-16 h-6 bg-white/5 rounded-md" />
          <div className="w-20 h-6 bg-white/5 rounded-md" />
        </div>
      ))}
    </div>
  )
}

// ── Companies List Skeleton ─────────────────────────────────────────
export const CompaniesSkeleton: FC = () => {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden divide-y divide-border-default animate-pulse">
      <div className="p-4 bg-white/[0.02] flex items-center justify-between">
        <div className="w-6 h-6 bg-white/5 rounded" />
        <div className="w-32 h-4 bg-white/5 rounded" />
        <div className="w-20 h-4 bg-white/5 rounded" />
        <div className="w-20 h-4 bg-white/5 rounded" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-5 flex items-center gap-6">
          <div className="w-4.5 h-4.5 bg-white/5 rounded" />
          <div className="w-10 h-10 bg-white/5 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/4 h-5 bg-white/5 rounded" />
            <div className="w-1/6 h-3.5 bg-white/5 rounded" />
          </div>
          <div className="w-16 h-6 bg-white/5 rounded-md" />
          <div className="w-24 h-4 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Analytics Card Layout Skeleton ──────────────────────────────────
export const AnalyticsSkeleton: FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-5 h-48 space-y-4">
            <div className="w-1/3 h-5 bg-white/5 rounded" />
            <div className="w-full h-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-bg-surface border border-border-default rounded-xl p-6 h-80 space-y-4">
        <div className="w-1/4 h-6 bg-white/5 rounded" />
        <div className="w-full h-56 bg-white/5 rounded-lg" />
      </div>
    </div>
  )
}

// ── Settings Page Skeleton ──────────────────────────────────────────
export const SettingsSkeleton: FC = () => {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-6 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="w-1/4 h-6 bg-white/5 rounded" />
        <div className="w-1/2 h-4 bg-white/5 rounded" />
      </div>
      <div className="space-y-6 max-w-xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="w-20 h-4 bg-white/5 rounded" />
            <div className="w-full h-10 bg-white/5 rounded-md" />
          </div>
        ))}
        <div className="w-28 h-10 bg-white/5 rounded-md" />
      </div>
    </div>
  )
}

// ── Profile Card Skeleton ───────────────────────────────────────────
export const ProfileSkeleton: FC = () => {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-6 flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="w-24 h-24 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-4 py-2">
        <div className="space-y-2">
          <div className="w-1/3 h-6 bg-white/5 rounded" />
          <div className="w-1/4 h-4 bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
          <div className="h-10 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  )
}
