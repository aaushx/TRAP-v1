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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="text-center mb-8 shrink-0">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Review Your Goal</h2>
        <p className="text-text-secondary">Everything looks great. Let's do a final check before building your workspace.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 min-h-0 pr-2">
        
        {/* Core Info */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 shadow-glow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-violet-400 mb-1">{state.title}</h3>
              <p className="text-text-secondary">{state.description || 'No description provided'}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-border-default rounded-full text-sm">
                <Target className="w-4 h-4 text-violet-400" />
                {state.targetRole}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-default">
            <div>
              <span className="text-xs text-text-tertiary block mb-1">Topics</span>
              <span className="text-lg font-bold text-text-primary">{state.selectedTopics.length}</span>
            </div>
            <div>
              <span className="text-xs text-text-tertiary block mb-1">Est. Time</span>
              <span className="text-lg font-bold text-text-primary flex items-center gap-1">
                <Clock className="w-4 h-4" /> {Math.round(totalHours)}h
              </span>
            </div>
            <div>
              <span className="text-xs text-text-tertiary block mb-1">Pace</span>
              <span className="text-lg font-bold text-text-primary">{state.dailyStudyHours}h / day</span>
            </div>
            <div>
              <span className="text-xs text-text-tertiary block mb-1">Est. Completion</span>
              <span className="text-lg font-bold text-text-primary flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {estimatedDays} days
              </span>
            </div>
          </div>
        </div>

        {/* Health Checks */}
        {warnings.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
            <h4 className="font-bold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Goal Health Warnings
            </h4>
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-warning/90 flex items-start gap-2">
                  <span className="mt-1">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length === 0 && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-6 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <h4 className="font-bold text-success">Perfectly Optimized</h4>
              <p className="text-sm text-success/80">Your goal has no warnings and is perfectly structured.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl">
            {error}
          </div>
        )}

      </div>

      <div className="pt-6 mt-2 border-t border-border-default flex justify-between shrink-0">
        <button
          onClick={prevStep}
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          Back to Edit
        </button>
        <button
          onClick={handleCreate}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-bold transition-all shadow-glow-md disabled:opacity-50 disabled:cursor-wait"
        >
          {isSubmitting ? 'Building Workspace...' : 'Create Goal'}
          {!isSubmitting && <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
