/**
 * Analytics Dashboard Page for TRAP Placement Preparation Operating System.
 * 
 * Renders real-time analytical breakdowns across Problem Solving, Company Application Funnels,
 * Subject Coverage, and Daily Activity Trends.
 * Uses the Nothing OS Light minimalist design system.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Code2,
  Building2,
  Target,
  Flame,
  Clock,
  TrendingUp,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react'

import { analyticsApi, AnalyticsSummary } from '@/services/api/analytics'
import { StatCard } from '@/components/dashboard/StatCard'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true)
        setError(null)
        const summary = await analyticsApi.getSummary()
        setData(summary)
      } catch (err: any) {
        console.error('Failed to load analytics', err)
        setError(err.message || 'Failed to load analytics data.')
      } finally {
        setIsLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-border-default">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-bg-container-high rounded" />
            <div className="h-4 w-72 bg-bg-container-low rounded" />
          </div>
          <div className="h-10 w-28 bg-bg-container-high rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-bg-surface border border-border-default rounded-md p-5 h-28 space-y-2">
              <div className="h-4 w-24 bg-bg-container-low rounded" />
              <div className="h-8 w-16 bg-bg-container-high rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-bg-surface border border-border-default rounded-md p-6 h-72" />
          <div className="bg-bg-surface border border-border-default rounded-md p-6 h-72" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-secondary mb-4" />
        <h2 className="text-xl font-display font-bold text-primary uppercase tracking-tight mb-2">Analytics System Interrupted</h2>
        <p className="text-text-secondary text-sm mb-6">{error || 'Unable to retrieve preparation metrics.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-primary text-text-inverse font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-primary/95 transition-colors cursor-pointer"
        >
          Retry Analytics Connection
        </button>
      </div>
    )
  }

  const { problems, companies, goals, readiness, activity_trends, study_distribution } = data
  const totalDifficulties = (problems.by_difficulty.easy + problems.by_difficulty.medium + problems.by_difficulty.hard) || 1
  const easyPct = Math.round((problems.by_difficulty.easy / totalDifficulties) * 100)
  const medPct = Math.round((problems.by_difficulty.medium / totalDifficulties) * 100)
  const hardPct = Math.round((problems.by_difficulty.hard / totalDifficulties) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-8 pb-12"
    >
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Preparation Analytics
          </h1>
          <p className="text-text-secondary text-xs font-mono uppercase tracking-wider mt-1">
            Real-time telemetry and placement readiness insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-bg-container-low border border-border-default rounded font-mono text-xs text-text-secondary flex items-center gap-2">
            <Flame className="w-4 h-4 text-secondary" />
            <span className="font-bold text-primary">{readiness.current_streak} DAY</span> STREAK
          </div>
          <div className="px-3 py-1.5 bg-bg-container-low border border-border-default rounded font-mono text-xs text-text-secondary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">{readiness.placement_readiness_index}%</span> PRI SCORE
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Code2 className="w-4 h-4" />}
          label="Problems Solved"
          value={`${problems.total_solved}`}
          subtitle={`${problems.total_tracked} tracked`}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={0}
        />
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Topic Mastery"
          value={`${goals.completed_topics}/${goals.total_topics}`}
          subtitle={`${goals.average_progress}% average goal progress`}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={1}
        />
        <StatCard
          icon={<Building2 className="w-4 h-4" />}
          label="Pipeline Reach"
          value={`${companies.total_tracked}`}
          subtitle={`${companies.funnel.interviewing + companies.funnel.offered} active stages`}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={2}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Est. Study Remaining"
          value={`${Math.round(readiness.remaining_study_time)}h`}
          subtitle={`${goals.active_goals} active goals`}
          accentColor="border border-border-default bg-bg-container-low text-primary"
          index={3}
        />
      </div>

      {/* ── Section 1: Problem Solving Telemetry & Difficulty Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Difficulty Split (1/3) */}
        <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-border-default border-dashed pb-3">
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              Difficulty Spectrum
            </h2>
            <span className="text-[10px] font-mono text-text-tertiary uppercase">{problems.total_solved} Solved</span>
          </div>

          <div className="space-y-4">
            {/* Visual stacked bar */}
            <div className="flex h-3 rounded-sm overflow-hidden bg-bg-container-low border border-border-default">
              <div style={{ width: `${easyPct}%` }} className="bg-success" title={`Easy: ${problems.by_difficulty.easy}`} />
              <div style={{ width: `${medPct}%` }} className="bg-warning" title={`Medium: ${problems.by_difficulty.medium}`} />
              <div style={{ width: `${hardPct}%` }} className="bg-secondary" title={`Hard: ${problems.by_difficulty.hard}`} />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
              <div className="p-3 bg-bg-container-low border border-border-default rounded">
                <div className="text-[10px] font-bold text-success uppercase">Easy</div>
                <div className="text-base font-bold text-primary mt-1">{problems.by_difficulty.easy}</div>
                <div className="text-[10px] text-text-tertiary">{easyPct}%</div>
              </div>
              <div className="p-3 bg-bg-container-low border border-border-default rounded">
                <div className="text-[10px] font-bold text-warning uppercase">Medium</div>
                <div className="text-base font-bold text-primary mt-1">{problems.by_difficulty.medium}</div>
                <div className="text-[10px] text-text-tertiary">{medPct}%</div>
              </div>
              <div className="p-3 bg-bg-container-low border border-border-default rounded">
                <div className="text-[10px] font-bold text-secondary uppercase">Hard</div>
                <div className="text-base font-bold text-primary mt-1">{problems.by_difficulty.hard}</div>
                <div className="text-[10px] text-text-tertiary">{hardPct}%</div>
              </div>
            </div>

            {/* Platforms Distribution */}
            <div className="pt-4 border-t border-border-default border-dashed">
              <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Platform Matrix</div>
              <div className="flex flex-wrap gap-1.5">
                {problems.by_platform.map((p, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-bg-container-low border border-border-default rounded text-[10px] font-mono uppercase font-bold text-text-secondary">
                    {p.platform}: <span className="text-primary">{p.count}</span>
                  </span>
                ))}
                {problems.by_platform.length === 0 && (
                  <span className="text-xs text-text-tertiary italic">No platform telemetry logged</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Top Solved Topics Breakdown (1/3) */}
        <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-border-default border-dashed pb-3">
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Topic Distribution
            </h2>
            <Link to="/app/problems" className="text-[10px] font-mono text-text-secondary hover:text-primary uppercase tracking-wider flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {problems.by_topic.map((item, idx) => {
              const maxTopic = Math.max(...problems.by_topic.map(t => t.count), 1)
              const pct = Math.round((item.count / maxTopic) * 100)
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-primary truncate">{item.topic}</span>
                    <span className="text-text-secondary">{item.count} solved</span>
                  </div>
                  <div className="h-1.5 bg-bg-container-low rounded overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {problems.by_topic.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-text-tertiary">
                <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No topics solved yet.</p>
                <Link to="/app/problems" className="text-xs font-mono text-primary underline mt-2">
                  Solve your first problem
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: 14-Day Activity Velocity Trend (1/3) */}
        <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-border-default border-dashed pb-3">
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              14-Day Velocity
            </h2>
            <span className="text-[10px] font-mono text-text-tertiary uppercase">Daily Submissions</span>
          </div>

          <div className="space-y-4">
            {/* Simple bar graph */}
            <div className="flex items-end justify-between gap-1 h-36 pt-4">
              {activity_trends.map((day, idx) => {
                const maxCount = Math.max(...activity_trends.map(d => d.problems_solved), 4)
                const heightPct = Math.max(Math.round((day.problems_solved / maxCount) * 100), 6)
                const dateLabel = day.date.slice(5) // MM-DD
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <div className="w-full flex items-end justify-center h-28 bg-bg-container-low rounded-t-sm relative">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          day.problems_solved > 0 ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                      {day.problems_solved > 0 && (
                        <span className="absolute -top-5 text-[9px] font-mono font-bold text-primary opacity-0 group-hover/bar:opacity-100 transition-opacity">
                          {day.problems_solved}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-text-tertiary truncate w-full text-center">
                      {dateLabel}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-text-tertiary pt-2 border-t border-border-default border-dashed">
              <span>14 Days Ago</span>
              <span className="font-bold text-primary">{activity_trends.reduce((s, d) => s + d.problems_solved, 0)} Total Solved</span>
              <span>Today</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 2: Recruitment Pipeline & Application Funnel ────── */}
      <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-border-default border-dashed pb-3">
          <div>
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Recruitment Application Funnel
            </h2>
            <p className="text-[11px] text-text-secondary mt-0.5">Application progression stages across tracked companies</p>
          </div>
          <Link to="/app/companies" className="text-xs font-mono font-bold uppercase text-primary hover:underline flex items-center gap-1">
            Manage Pipeline <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Funnel Stage Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="p-4 bg-bg-container-low border border-border-default rounded text-center">
            <div className="text-[10px] font-mono font-bold uppercase text-text-tertiary">1. Wishlist</div>
            <div className="text-2xl font-bold font-display text-primary mt-1">{companies.funnel.wishlist}</div>
            <div className="text-[10px] text-text-tertiary mt-1">Identified</div>
          </div>
          <div className="p-4 bg-bg-container-low border border-border-default rounded text-center">
            <div className="text-[10px] font-mono font-bold uppercase text-text-tertiary">2. Applied</div>
            <div className="text-2xl font-bold font-display text-primary mt-1">{companies.funnel.applied}</div>
            <div className="text-[10px] text-text-tertiary mt-1">Submitted</div>
          </div>
          <div className="p-4 bg-bg-container-low border border-border-default rounded text-center">
            <div className="text-[10px] font-mono font-bold uppercase text-warning">3. Interviewing</div>
            <div className="text-2xl font-bold font-display text-warning mt-1">{companies.funnel.interviewing}</div>
            <div className="text-[10px] text-text-tertiary mt-1">In Progress</div>
          </div>
          <div className="p-4 bg-bg-container-low border border-border-default rounded text-center">
            <div className="text-[10px] font-mono font-bold uppercase text-success">4. Offered</div>
            <div className="text-2xl font-bold font-display text-success mt-1">{companies.funnel.offered}</div>
            <div className="text-[10px] text-text-tertiary mt-1">Conversions</div>
          </div>
          <div className="p-4 bg-bg-container-low border border-border-default rounded text-center">
            <div className="text-[10px] font-mono font-bold uppercase text-secondary">5. Rejected</div>
            <div className="text-2xl font-bold font-display text-secondary mt-1">{companies.funnel.rejected}</div>
            <div className="text-[10px] text-text-tertiary mt-1">Archived</div>
          </div>
        </div>

        {/* Roles Breakdown & Recent Submissions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border-default border-dashed">
          <div>
            <div className="text-xs font-mono font-bold uppercase text-primary mb-3">Roles Breakdown</div>
            <div className="space-y-2">
              {Object.entries(companies.by_role).map(([role, count], idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-bg-container-low border border-border-default rounded text-xs font-mono">
                  <span className="font-semibold text-primary">{role}</span>
                  <span className="px-2 py-0.5 bg-bg-container-high border border-border-default rounded text-[10px] font-bold text-primary">{count} applications</span>
                </div>
              ))}
              {Object.keys(companies.by_role).length === 0 && (
                <p className="text-xs text-text-tertiary italic">No company roles tracked yet.</p>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono font-bold uppercase text-primary mb-3">Recent Pipeline Actions</div>
            <div className="space-y-2">
              {companies.recent_applications.map((app, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-bg-container-low border border-border-default rounded text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="font-bold text-primary block">{app.name}</span>
                    <span className="text-[10px] text-text-tertiary uppercase">{app.role}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-bg-container-high border border-border-default rounded text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                    {app.status}
                  </span>
                </div>
              ))}
              {companies.recent_applications.length === 0 && (
                <p className="text-xs text-text-tertiary italic">No applications logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Goal & Subject Mastery Distribution ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Progress Matrix */}
        <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-border-default border-dashed pb-3">
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Category Coverage Matrix
            </h2>
            <Link to="/app/goals" className="text-[10px] font-mono text-text-secondary hover:text-primary uppercase tracking-wider flex items-center gap-1">
              Goals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {goals.category_progress.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-primary">{cat.name}</span>
                  <span className="text-text-secondary">
                    {cat.completed_topics}/{cat.total_topics} ({cat.percentage}%) • {cat.estimated_hours_remaining}h left
                  </span>
                </div>
                <div className="h-2 bg-bg-container-low rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {goals.category_progress.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-text-tertiary">
                <Target className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No roadmap goals created yet.</p>
                <Link to="/app/goals/new" className="text-xs font-mono text-primary underline mt-2">
                  Create a Goal in the Workspace
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Topic Status Telemetry & Study Distribution */}
        <div className="bg-bg-surface border border-border-default rounded-md p-6 relative group hover:border-primary transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          
          <div className="flex items-center justify-between mb-4 border-b border-border-default border-dashed pb-3">
            <h2 className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Topic Status Breakdown
            </h2>
            <span className="text-[10px] font-mono text-text-tertiary uppercase">{goals.total_topics} Total Topics</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
              <div className="p-2.5 bg-bg-container-low border border-border-default rounded">
                <div className="text-[9px] text-text-tertiary uppercase font-bold">Completed</div>
                <div className="text-base font-bold text-success mt-0.5">{goals.topic_status_breakdown.completed}</div>
              </div>
              <div className="p-2.5 bg-bg-container-low border border-border-default rounded">
                <div className="text-[9px] text-text-tertiary uppercase font-bold">Mastered</div>
                <div className="text-base font-bold text-primary mt-0.5">{goals.topic_status_breakdown.mastered}</div>
              </div>
              <div className="p-2.5 bg-bg-container-low border border-border-default rounded">
                <div className="text-[9px] text-text-tertiary uppercase font-bold">In Progress</div>
                <div className="text-base font-bold text-warning mt-0.5">{goals.topic_status_breakdown.in_progress}</div>
              </div>
              <div className="p-2.5 bg-bg-container-low border border-border-default rounded">
                <div className="text-[9px] text-text-tertiary uppercase font-bold">Needs Revision</div>
                <div className="text-base font-bold text-secondary mt-0.5">{goals.topic_status_breakdown.needs_revision}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-default border-dashed">
              <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Subject Study Time Distribution</div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {study_distribution.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-bg-container-low border border-border-default rounded text-xs font-mono">
                    <span className="text-primary font-semibold">{item.category}</span>
                    <span className="text-text-secondary">{item.estimated_hours_remaining}h ({item.topics_count} topics)</span>
                  </div>
                ))}
                {study_distribution.length === 0 && (
                  <span className="text-xs text-text-tertiary italic">All active goal topics completed!</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  )
}
