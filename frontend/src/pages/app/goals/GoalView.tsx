import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGoalStore } from '@/store/goal.store'
import { useToastStore } from '@/store/toast.store'
import { TopicStatus } from '@/services/api/goal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { 
  ArrowLeft, 
  Clock, 
  Link as LinkIcon, 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2,
  ListTodo
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function GoalView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { 
    currentGoal, 
    fetchGoalById, 
    updateTopicStatus, 
    deleteGoal,
    isLoading, 
    error, 
    clearCurrentGoal 
  } = useGoalStore()

  const { addToast } = useToastStore()
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<string>('')
  
  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGoalById(id)
    }
    return () => clearCurrentGoal()
  }, [id, fetchGoalById, clearCurrentGoal])

  if (isLoading || !currentGoal) {
    /* Detail View Loading Skeleton */
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="h-6 w-24 bg-white/5 rounded" />
        <div className="bg-bg-surface border border-border-default rounded-lg p-6 h-28 flex justify-between items-end">
          <div className="space-y-2 flex-1">
            <div className="w-1/3 h-7 bg-white/5 rounded" />
            <div className="w-1/4 h-4 bg-white/5 rounded" />
          </div>
          <div className="w-64 h-3 bg-white/5 rounded-full" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-bg-surface border border-border-default rounded-lg p-5 h-36 space-y-4">
            <div className="w-1/4 h-5 bg-white/5 rounded" />
            <div className="w-full h-1 bg-white/5 rounded" />
            <div className="w-1/2 h-4 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 text-error rounded-md border border-error/20 font-mono text-xs">
        {error}
      </div>
    )
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'badge-easy'
      case 'medium': return 'badge-medium'
      case 'hard': return 'badge-hard'
      default: return 'bg-bg-container-low text-text-secondary border border-border-default'
    }
  }

  const handleStatusChange = async (topicId: string, status: TopicStatus) => {
    try {
      await updateTopicStatus(topicId, status)
      addToast('Topic status updated successfully!', 'success')
    } catch (err) {
      addToast('Failed to update topic status.', 'error')
    }
  }

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const handleNotesSave = async (topicId: string) => {
    try {
      await updateTopicStatus(topicId, undefined, tempNotes)
      setEditingNotesId(null)
      addToast('Notes updated successfully!', 'success')
    } catch (err) {
      addToast('Failed to save notes.', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await deleteGoal(currentGoal.id)
      addToast('Goal deleted successfully!', 'success')
      setIsDeleteDialogOpen(false)
      navigate('/app/goals')
    } catch (err) {
      addToast('Failed to delete goal.', 'error')
      setIsDeleting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 pb-10 relative"
    >
      {/* Back & Delete Header controls */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Link to="/app/goals" className="inline-flex items-center text-xs font-mono uppercase tracking-wider text-text-tertiary hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Goals
          </Link>
          
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-container-low border border-border-default text-text-secondary hover:bg-secondary/15 hover:text-secondary hover:border-secondary/30 rounded text-xs font-mono uppercase font-bold tracking-wide transition-colors cursor-pointer focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" />
            Delete Goal
          </button>
        </div>
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white border border-border-default rounded-md p-6 shadow-sm relative group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          <div className="space-y-2 mt-1">
            <h1 className="text-2xl font-bold font-display text-primary uppercase tracking-tight">{currentGoal.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-mono">
              <span className="flex items-center gap-1 bg-bg-container-low px-2 py-0.5 border border-border-default rounded">
                <Target className="w-3.5 h-3.5" />
                {currentGoal.target_role}
              </span>
              <div className="flex gap-1.5">
                {currentGoal.target_companies.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-bg-container-low border border-border-default rounded uppercase tracking-wide text-[10px] font-bold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              <span>Progress</span>
              <span className="font-bold">{currentGoal.progress}%</span>
            </div>
            <div className="h-2 bg-bg-container-low rounded overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${currentGoal.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="space-y-6">
        {currentGoal.categories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.id)
          return (
            <div key={category.id} className="bg-white border border-border-default rounded-md overflow-hidden shadow-sm relative group">
              {/* Top Stripe Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
              
              {/* Category Header */}
              <div 
                className="p-5 border-b border-border-default bg-bg-container-low cursor-pointer flex items-center justify-between hover:bg-bg-container-low/80 transition-colors mt-1"
                onClick={() => toggleCategory(category.id)}
              >
                <div>
                  <h2 className="text-lg font-bold font-display text-primary flex items-center gap-2 uppercase tracking-tight">
                    <ListTodo className="w-4.5 h-4.5 text-text-secondary" />
                    {category.name}
                  </h2>
                </div>
                <div className="text-text-tertiary">
                  {isCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                </div>
              </div>

              {/* Topics list */}
              {!isCollapsed && (
                <div className="divide-y divide-border-default">
                  {category.topics.map((topic) => (
                    <div key={topic.id} className="flex flex-col hover:bg-bg-container-low/40 transition-colors">
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-sm font-semibold ${topic.status === 'completed' ? 'text-text-tertiary line-through font-normal' : 'text-primary'}`}>
                              {topic.name}
                            </h3>
                            {topic.difficulty && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getDifficultyColor(topic.difficulty)}`}>
                                {topic.difficulty}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-[11px] font-mono text-text-tertiary uppercase tracking-tight font-bold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {topic.estimated_hours}h EST
                            </span>
                            {topic.resource_links && topic.resource_links.length > 0 && (
                              <span className="flex items-center gap-1">
                                <LinkIcon className="w-3.5 h-3.5" />
                                {topic.resource_links.length} RESOURCES
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Select dropdown */}
                        <div className="flex items-center shrink-0">
                          <select
                            value={topic.status}
                            onChange={(e) => handleStatusChange(topic.id, e.target.value as TopicStatus)}
                            className="
                              text-xs font-mono font-bold uppercase tracking-wide rounded px-3 py-2 border outline-none cursor-pointer appearance-none pr-8
                              bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] 
                              bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em]
                              transition-colors bg-bg-container-low border-border-default text-text-secondary hover:border-primary focus:ring-1 focus:ring-primary
                            "
                          >
                            <option value="not_started" className="bg-white">Not Started</option>
                            <option value="bookmarked" className="bg-white">Bookmarked</option>
                            <option value="in_progress" className="bg-white">In Progress</option>
                            <option value="needs_revision" className="bg-white">Needs Revision</option>
                            <option value="completed" className="bg-white">Completed</option>
                            <option value="mastered" className="bg-white">Mastered</option>
                            <option value="skipped" className="bg-white">Skipped</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Notes Input / Preview */}
                      <div className="px-4 pb-4 sm:px-5">
                        {editingNotesId === topic.id ? (
                          <div className="mt-2 flex gap-2">
                            <input 
                              type="text" 
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add topic notes..."
                              className="flex-1 bg-bg-container-low border border-border-default rounded px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              onKeyDown={(e) => e.key === 'Enter' && handleNotesSave(topic.id)}
                              autoFocus
                            />
                            <button onClick={() => handleNotesSave(topic.id)} className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-mono font-bold uppercase rounded cursor-pointer">Save</button>
                            <button onClick={() => setEditingNotesId(null)} className="px-3 py-1.5 bg-bg-container-low hover:bg-bg-container-high text-text-secondary text-xs font-mono font-bold uppercase rounded cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-start gap-2 group/notes cursor-pointer" onClick={() => {
                            setTempNotes(topic.notes || '')
                            setEditingNotesId(topic.id)
                          }}>
                            <Edit3 className="w-3.5 h-3.5 text-text-tertiary mt-1 opacity-0 group-hover/notes:opacity-100 transition-opacity" />
                            <p className="text-xs text-text-secondary italic">
                              {topic.notes || <span className="text-text-tertiary font-mono not-italic text-[10px] uppercase tracking-wider">Add notes...</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Universal Confirm Dialog for deletion */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Goal"
        message="Are you sure you want to permanently delete this goal? This action cannot be undone."
        confirmText="Delete Goal"
        isDangerous
        isLoading={isDeleting}
      />
    </motion.div>
  )
}
