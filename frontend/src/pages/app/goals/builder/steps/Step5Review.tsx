import { useBuilderContext } from '../GoalBuilder'
import { Target, Clock, AlertTriangle, CheckCircle, Calendar, Send } from 'lucide-react'
import { useGoalStore } from '@/store/goal.store'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function Step5Review() {
  const { state, prevStep } = useBuilderContext()
  const { createGoal } = useGoalStore()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalHours = state.selectedTopics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)
  const estimatedDays = Math.ceil(totalHours / state.dailyStudyHours)

  // Health Checks
  const warnings = []
  if (!state.deadline) warnings.push("No deadline selected. We recommend setting one to stay on track.")
  if (state.selectedTopics.length < 5) warnings.push("You have selected very few topics. Consider adding more.")
  if (state.milestones.length === 0) warnings.push("You didn't create any custom phases. We will group topics by category automatically.")

  const unassignedTopics = state.selectedTopics.filter(t => !state.milestones.flatMap(m => m.topics.map((mt:any) => mt.name)).includes(t.name))
  if (state.milestones.length > 0 && unassignedTopics.length > 0) {
    warnings.push(`${unassignedTopics.length} topics were left unassigned and will be placed in an 'Uncategorized' phase.`)
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Compile final categories payload
      let categoriesPayload: any[] = []
      
      if (state.milestones.length > 0) {
        // User organized into milestones
        categoriesPayload = state.milestones.map((m, i) => ({
          name: m.name,
          sort_order: i,
          topics: m.topics.map((t: any, j: number) => ({
            name: t.name,
            difficulty: t.difficulty,
            estimated_hours: t.estimated_hours,
            resource_links: [],
            sort_order: j
          }))
        }))
        // Handle unassigned if any
        if (unassignedTopics.length > 0) {
          categoriesPayload.push({
            name: "Uncategorized",
            sort_order: state.milestones.length,
            topics: unassignedTopics.map((t, j) => ({
              name: t.name,
              difficulty: t.difficulty,
              estimated_hours: t.estimated_hours,
              resource_links: [],
              sort_order: j
            }))
          })
        }
      } else {
        // Automatically group by topic category
        const catMap = new Map<string, any[]>()
        state.selectedTopics.forEach(t => {
          const c = t.category || "Other"
          if (!catMap.has(c)) catMap.set(c, [])
          catMap.get(c)!.push(t)
        })
        
        let sortIndex = 0
        for (const [catName, topics] of catMap.entries()) {
          categoriesPayload.push({
            name: catName,
            sort_order: sortIndex++,
            topics: topics.map((t, j) => ({
              name: t.name,
              difficulty: t.difficulty,
              estimated_hours: t.estimated_hours,
              resource_links: [],
              sort_order: j
            }))
          })
        }
      }

      const payload = {
        title: state.title,
        description: state.description,
        target_role: state.targetRole,
        target_companies: state.targetCompanies,
        deadline: state.deadline ? new Date(state.deadline).toISOString() : undefined,
        priority: state.priority,
        categories: categoriesPayload
      }

      const goal = await createGoal(payload)
      navigate(`/app/goals/${goal.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create goal")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col space-y-8 max-w-4xl mx-auto w-full">
      <div className="text-center shrink-0 border-b border-border-default border-dashed pb-6">
        <h2 className="text-2xl font-bold font-display text-primary uppercase tracking-tight mb-2">
          Review Your Preparation Goal
        </h2>
        <p className="text-text-secondary font-mono text-xs max-w-lg mx-auto">
          Everything is set. Verify your target parameters before generating your customized placement workspace.
        </p>
      </div>

      <div className="space-y-6">
        {/* Core Info Card */}
        <div className="bg-bg-base border border-border-default rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-text-tertiary tracking-wider block mb-1">Goal Plan</span>
              <h3 className="text-xl font-bold font-display text-primary mb-1 uppercase tracking-tight">{state.title}</h3>
              <p className="text-text-secondary text-xs">{state.description || 'No detailed description provided'}</p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-surface border border-border-default rounded-full text-xs font-mono font-bold text-primary">
                <Target className="w-3.5 h-3.5 text-primary" />
                {state.targetRole}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-default font-mono">
            <div className="p-3 bg-bg-surface rounded border border-border-default/60">
              <span className="text-[10px] text-text-tertiary uppercase block mb-1">Topics</span>
              <span className="text-base font-bold text-primary">{state.selectedTopics.length}</span>
            </div>
            <div className="p-3 bg-bg-surface rounded border border-border-default/60">
              <span className="text-[10px] text-text-tertiary uppercase block mb-1">Est. Time</span>
              <span className="text-base font-bold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-text-tertiary" /> {Math.round(totalHours)}h
              </span>
            </div>
            <div className="p-3 bg-bg-surface rounded border border-border-default/60">
              <span className="text-[10px] text-text-tertiary uppercase block mb-1">Pace</span>
              <span className="text-base font-bold text-primary">{state.dailyStudyHours}h / day</span>
            </div>
            <div className="p-3 bg-bg-surface rounded border border-border-default/60">
              <span className="text-[10px] text-text-tertiary uppercase block mb-1">Est. Duration</span>
              <span className="text-base font-bold text-primary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-text-tertiary" /> {estimatedDays} days
              </span>
            </div>
          </div>
        </div>

        {/* Health Checks */}
        {warnings.length > 0 && (
          <div className="bg-warning/10 border border-warning/25 rounded-xl p-5">
            <h4 className="font-mono text-xs font-bold uppercase text-warning mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Goal Preparation Warnings ({warnings.length})
            </h4>
            <ul className="space-y-1.5 font-mono text-xs text-warning/90">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-warning">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length === 0 && (
          <div className="bg-success/10 border border-success/25 rounded-xl p-5 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-success shrink-0" />
            <div>
              <h4 className="font-mono text-xs font-bold uppercase text-success">Optimally Structured</h4>
              <p className="text-xs text-success/90 mt-0.5">Your goal configuration covers core topics, deadlines, and realistic daily commitments.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-error/10 border border-error/25 text-error rounded-xl font-mono text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Action Toolbar */}
      <div className="pt-6 border-t border-border-default flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="px-6 py-3 rounded text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-container-low transition-colors disabled:opacity-50 cursor-pointer"
        >
          Back to Edit
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-text-inverse hover:bg-secondary disabled:opacity-50 disabled:cursor-wait text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
        >
          {isSubmitting ? 'Building Goal...' : 'Launch Goal Workspace'}
          {!isSubmitting && <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
