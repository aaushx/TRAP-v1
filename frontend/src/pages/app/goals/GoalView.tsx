import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGoalStore } from '@/store/goal.store'
import { useToastStore } from '@/store/toast.store'
import { TopicStatus } from '@/services/api/goal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2,
  ListTodo,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  Code2
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
    clearCurrentGoal,
    companyPreparation,
    isPrepLoading,
    fetchCompanyPreparation,
    updateQuestionProgress
  } = useGoalStore()

  const { addToast } = useToastStore()
  
  const [activeTab, setActiveTab] = useState<'company_prep' | 'roadmap'>('company_prep')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState<string>('')
  
  // Company Prep Filters
  const [companyFilter, setCompanyFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGoalById(id)
    }
    return () => clearCurrentGoal()
  }, [id, fetchGoalById, clearCurrentGoal])

  // Fetch company preparation when goal is loaded and filters change
  useEffect(() => {
    if (id && currentGoal && currentGoal.target_companies && currentGoal.target_companies.length > 0) {
      fetchCompanyPreparation(id, {
        company: companyFilter,
        topic: topicFilter,
        difficulty: difficultyFilter,
        status: statusFilter,
        search: searchQuery
      })
    }
  }, [id, currentGoal, companyFilter, topicFilter, difficultyFilter, statusFilter, searchQuery, fetchCompanyPreparation])

  if (isLoading || !currentGoal) {
    /* Detail View Loading Skeleton */
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        <div className="h-6 w-24 bg-bg-container-high rounded" />
        <div className="bg-bg-surface border border-border-default rounded-lg p-6 h-28 flex justify-between items-end">
          <div className="space-y-2 flex-1">
            <div className="w-1/3 h-7 bg-bg-container-high rounded" />
            <div className="w-1/4 h-4 bg-bg-container-high rounded" />
          </div>
          <div className="w-64 h-3 bg-bg-container-high rounded-full" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-bg-surface border border-border-default rounded-lg p-5 h-36 space-y-4">
            <div className="w-1/4 h-5 bg-bg-container-high rounded" />
            <div className="w-full h-1 bg-bg-container-high rounded" />
            <div className="w-1/2 h-4 bg-bg-container-high rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-bg-surface border border-border-default rounded-lg space-y-4">
        <p className="text-secondary font-mono text-sm">{error}</p>
        <button 
          onClick={() => navigate('/app/goals')} 
          className="px-4 py-2 border border-border-default rounded text-xs font-mono font-bold uppercase hover:bg-bg-container-low transition-colors text-text-primary"
        >
          Back to Goals
        </button>
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
    } catch {
      addToast('Failed to update topic status.', 'error')
    }
  }

  const handleQuestionStatusChange = async (questionId: string, status: 'not_started' | 'attempted' | 'solved' | 'needs_revision') => {
    try {
      await updateQuestionProgress(questionId, status)
      addToast('Question progress updated!', 'success')
    } catch {
      addToast('Failed to update question progress.', 'error')
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
    } catch {
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
    } catch {
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-bg-surface border border-border-default rounded-md p-6 shadow-sm relative group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
          <div className="space-y-2 mt-1">
            <h1 className="text-2xl font-bold font-display text-primary uppercase tracking-tight">{currentGoal.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-mono">
              <span className="flex items-center gap-1 bg-bg-container-low px-2 py-0.5 border border-border-default rounded">
                <Target className="w-3.5 h-3.5" />
                {currentGoal.target_role}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {currentGoal.target_companies.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-container-low border border-border-default rounded uppercase tracking-wide text-[10px] font-bold">
                    <CompanyLogo company={c} size="xs" showContainer={false} className="w-3.5 h-3.5" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              <span>{activeTab === 'company_prep' && companyPreparation ? 'Company Prep Readiness' : 'Curriculum Progress'}</span>
              <span className="font-bold">
                {activeTab === 'company_prep' && companyPreparation 
                  ? `${companyPreparation.overall_progress_percentage}%` 
                  : `${currentGoal.progress}%`}
              </span>
            </div>
            <div className="h-2 bg-bg-container-low rounded overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ 
                  width: `${activeTab === 'company_prep' && companyPreparation 
                    ? companyPreparation.overall_progress_percentage 
                    : currentGoal.progress}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Switcher Tabs */}
      <div className="flex border-b border-border-default space-x-6 text-xs font-mono uppercase tracking-wider select-none">
        {currentGoal.target_companies && currentGoal.target_companies.length > 0 && (
          <button
            onClick={() => setActiveTab('company_prep')}
            className={`pb-3 font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'company_prep'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-primary'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Company Preparation ({currentGoal.target_companies.length} Target{currentGoal.target_companies.length > 1 ? 's' : ''})
          </button>
        )}
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`pb-3 font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'roadmap'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Curriculum Roadmap ({currentGoal.categories.length} Categories)
        </button>
      </div>

      {/* ── COMPANY PREPARATION TAB ── */}
      {activeTab === 'company_prep' && (
        <div className="space-y-8">
          {/* Per-Company Progress Grid */}
          {companyPreparation && companyPreparation.company_stats.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-text-secondary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-400" />
                Target Company Readiness
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyPreparation.company_stats.map((cs) => {
                  const isSelected = companyFilter === cs.company_name
                  return (
                    <div 
                      key={cs.company_name}
                      onClick={() => setCompanyFilter(isSelected ? 'all' : cs.company_name)}
                      className={`p-5 rounded-md border transition-all cursor-pointer bg-bg-surface relative group ${
                        isSelected 
                          ? 'border-primary shadow-sm ring-1 ring-primary' 
                          : 'border-border-default hover:border-text-secondary'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                            <CompanyLogo company={cs.company_name} size="xs" showContainer={false} className="w-4 h-4" />
                            {cs.company_name}
                          </h3>
                          <span className="text-[10px] font-mono text-text-tertiary uppercase">
                            {cs.topics_covered} of {cs.total_topics} topics covered
                          </span>
                        </div>
                        <span className="text-lg font-bold font-mono text-primary">
                          {cs.progress_percentage}%
                        </span>
                      </div>
                      
                      {/* Company progress bar */}
                      <div className="h-1.5 w-full bg-bg-container-low rounded overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${cs.progress_percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-[11px] font-mono text-text-secondary">
                        <span>DSA Solved</span>
                        <span className="font-semibold text-primary">{cs.solved_questions} / {cs.total_questions}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const slug = cs.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                          navigate(`/app/company-dsa/${slug}`)
                        }}
                        className="mt-3 w-full py-1.5 px-3 rounded text-xs font-mono font-bold bg-bg-base border border-border-default hover:border-primary text-text-primary flex items-center justify-center gap-1 transition-colors"
                      >
                        Prepare →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters Toolbar */}
          <div className="p-4 bg-bg-surface border border-border-default rounded-md shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search questions by title..."
                  className="w-full bg-bg-base border border-border-default rounded px-3 py-2 pl-9 text-xs text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Company & Topic Dropdowns */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Company filter */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-text-tertiary">Company:</span>
                  <select 
                    value={companyFilter}
                    onChange={e => setCompanyFilter(e.target.value)}
                    className="bg-bg-container-low border border-border-default rounded px-2.5 py-1.5 text-xs font-mono font-medium outline-none cursor-pointer"
                  >
                    <option value="all">All Companies</option>
                    {currentGoal.target_companies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Topic filter */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-text-tertiary">Topic:</span>
                  <select 
                    value={topicFilter}
                    onChange={e => setTopicFilter(e.target.value)}
                    className="bg-bg-container-low border border-border-default rounded px-2.5 py-1.5 text-xs font-mono font-medium outline-none cursor-pointer max-w-[160px]"
                  >
                    <option value="all">All Topics</option>
                    {companyPreparation?.topic_breakdown.map(t => (
                      <option key={t.topic_name} value={t.topic_name}>
                        {t.topic_name} ({t.total_questions})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty buttons */}
                <div className="flex items-center gap-1">
                  {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                        difficultyFilter === diff 
                          ? 'bg-primary text-text-inverse border-primary' 
                          : 'bg-bg-container-low text-text-secondary border-border-default hover:border-text-secondary'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-default text-xs font-mono">
              <span className="text-text-tertiary uppercase text-[10px] font-bold mr-1">Status:</span>
              {[
                { label: 'All Statuses', val: 'all' },
                { label: 'Not Started', val: 'not_started' },
                { label: 'Attempted', val: 'attempted' },
                { label: 'Solved', val: 'solved' },
                { label: 'Needs Revision', val: 'needs_revision' },
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => setStatusFilter(s.val)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-all cursor-pointer ${
                    statusFilter === s.val 
                      ? 'bg-primary/15 border-primary text-primary font-bold' 
                      : 'bg-bg-base border-border-default text-text-secondary hover:border-text-secondary'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-mono text-text-secondary">
              <span>
                {isPrepLoading ? 'Loading questions...' : `Showing ${companyPreparation?.questions.length || 0} questions (${companyPreparation?.solved_unique_questions || 0} solved)`}
              </span>
              {companyFilter !== 'all' && (
                <button 
                  onClick={() => setCompanyFilter('all')}
                  className="text-text-tertiary hover:text-primary underline cursor-pointer"
                >
                  Clear company filter
                </button>
              )}
            </div>

            {isPrepLoading ? (
              <div className="p-8 text-center text-xs font-mono text-text-tertiary">
                Filtering company preparation dataset...
              </div>
            ) : !companyPreparation || companyPreparation.questions.length === 0 ? (
              <div className="p-12 text-center bg-bg-surface border border-border-default rounded-md">
                <Code2 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <h3 className="text-sm font-bold text-primary mb-1">No Questions Found</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Try adjusting your search query, difficulty, or topic filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-default border border-border-default rounded-md bg-bg-surface overflow-hidden shadow-sm">
                {companyPreparation.questions.map((q) => (
                  <div key={q.id} className="p-4 sm:p-5 hover:bg-bg-container-low/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                          {q.platform_url ? (
                            <a href={q.platform_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                              {q.title}
                              <ExternalLink className="w-3 h-3 text-text-tertiary" />
                            </a>
                          ) : (
                            q.title
                          )}
                        </h4>
                        
                        {/* Difficulty */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>

                        {/* Status indicator */}
                        {q.status === 'solved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/15 border border-success/30 text-success text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            SOLVED
                          </span>
                        )}
                      </div>

                      {/* Company badges: "Asked by: Google · Amazon" */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-text-tertiary">Asked by:</span>
                        {q.companies.map((comp) => (
                          <span 
                            key={comp}
                            onClick={() => setCompanyFilter(comp)}
                            className="px-2 py-0.5 bg-bg-container-low border border-border-default rounded text-[10px] font-medium text-text-secondary hover:border-primary cursor-pointer transition-colors"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>

                      {/* Topic pills */}
                      {q.topics && q.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {q.topics.map(t => (
                            <span 
                              key={t}
                              onClick={() => setTopicFilter(t)}
                              className="px-1.5 py-0.5 bg-bg-base border border-border-subtle rounded text-[9px] font-mono text-text-tertiary hover:text-primary cursor-pointer"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Practice & Status Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {q.platform_url && (
                        <a
                          href={q.platform_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-bg-container-low hover:bg-bg-container-high border border-border-default text-primary rounded text-xs font-mono font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-1"
                        >
                          Practice
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {/* Status Selector */}
                      <select
                        value={q.status}
                        onChange={(e) => handleQuestionStatusChange(q.id, e.target.value as any)}
                        className={`
                          text-xs font-mono font-bold uppercase tracking-wide rounded px-3 py-1.5 border outline-none cursor-pointer
                          ${q.status === 'solved' ? 'bg-success/15 border-success/30 text-success' :
                            q.status === 'attempted' ? 'bg-warning/15 border-warning/30 text-warning' :
                            q.status === 'needs_revision' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
                            'bg-bg-container-low border-border-default text-text-secondary'}
                        `}
                      >
                        <option value="not_started" className="bg-bg-surface text-primary">Not Started</option>
                        <option value="attempted" className="bg-bg-surface text-primary">Attempted</option>
                        <option value="solved" className="bg-bg-surface text-primary">Solved</option>
                        <option value="needs_revision" className="bg-bg-surface text-primary">Needs Revision</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CURRICULUM ROADMAP TAB ── */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {currentGoal.categories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.id)
            return (
              <div key={category.id} className="bg-bg-surface border border-border-default rounded-md overflow-hidden shadow-sm relative group">
                {/* Top Stripe Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-25 dot-matrix-strip"></div>
                
                {/* Category Header */}
                <div 
                  className="p-5 border-b border-border-default bg-bg-container-low cursor-pointer flex items-center justify-between hover:bg-bg-container-low/80 transition-colors mt-1"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-text-tertiary hover:text-primary">
                      {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <div>
                      <h2 className="font-bold text-base text-primary uppercase font-display">{category.name}</h2>
                      <span className="text-xs font-mono text-text-tertiary">
                        {category.topics.filter(t => ['completed', 'mastered'].includes(t.status)).length} / {category.topics.length} topics finished
                      </span>
                    </div>
                  </div>
                  
                  {/* Category mini progress */}
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-bg-container-high rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${(category.topics.filter(t => ['completed', 'mastered'].includes(t.status)).length / (category.topics.length || 1)) * 100}%` 
                        }} 
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-text-secondary">
                      {Math.round((category.topics.filter(t => ['completed', 'mastered'].includes(t.status)).length / (category.topics.length || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Topics List */}
                {!isCollapsed && (
                  <div className="divide-y divide-border-default">
                    {category.topics.map((topic) => (
                      <div key={topic.id} className="hover:bg-bg-container-low/30 transition-colors">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm text-primary">{topic.name}</h3>
                              {topic.difficulty && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${getDifficultyColor(topic.difficulty)}`}>
                                  {topic.difficulty}
                                </span>
                              )}
                              {topic.estimated_hours && (
                                <span className="flex items-center gap-1 text-[11px] font-mono text-text-tertiary">
                                  <Clock className="w-3 h-3" />
                                  {topic.estimated_hours}h
                                </span>
                              )}
                            </div>
                            
                            {/* Resources links if any */}
                            {topic.resource_links && topic.resource_links.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {topic.resource_links.map((linkUrl, idx) => (
                                  <a
                                    key={idx}
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary font-mono transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Resource {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action: Status Selector */}
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={topic.status}
                              onChange={(e) => handleStatusChange(topic.id, e.target.value as TopicStatus)}
                              className="
                                text-xs font-mono font-bold uppercase px-3 py-1.5 rounded border 
                                cursor-pointer outline-none appearance-none pr-8
                                bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em]
                                transition-colors bg-bg-container-low border-border-default text-text-secondary hover:border-primary focus:ring-1 focus:ring-primary
                              "
                            >
                              <option value="not_started" className="bg-bg-surface text-primary">Not Started</option>
                              <option value="bookmarked" className="bg-bg-surface text-primary">Bookmarked</option>
                              <option value="in_progress" className="bg-bg-surface text-primary">In Progress</option>
                              <option value="needs_revision" className="bg-bg-surface text-primary">Needs Revision</option>
                              <option value="completed" className="bg-bg-surface text-primary">Completed</option>
                              <option value="mastered" className="bg-bg-surface text-primary">Mastered</option>
                              <option value="skipped" className="bg-bg-surface text-primary">Skipped</option>
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
                              <button onClick={() => handleNotesSave(topic.id)} className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-text-inverse text-xs font-mono font-bold uppercase rounded cursor-pointer">Save</button>
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
      )}

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
