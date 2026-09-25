import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  BookOpen,
  ListTodo,
  Target,
  X,
  FileText,
  Calendar,
  ArrowUpDown
} from 'lucide-react'
import { useCompanyDsaStore } from '@/store/companyDsa.store'
import { useToastStore } from '@/store/toast.store'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import { companyDsaApi, CompanyDsaQuestionItem, QuestionDetail } from '@/services/api/companyDsa'

type PrepTab = 'overview' | 'questions' | 'topics'
type TimePeriodKey = 'all' | 'thirty_days' | 'three_months' | 'six_months' | 'more_than_six_months'
type SortKey = 'frequency' | 'difficulty' | 'title'

/**
 * CompanyPreparationPage Component
 *
 * Dedicated interview preparation hub for an individual target company.
 * Features:
 * - Real-time company statistics (total questions, solved, attempted, revision)
 * - Granular difficulty & DSA topic breakdown
 * - Time-period filtering (30 days, 3 months, 6 months, > 6 months, all-time)
 * - Sorting by frequency, difficulty, and question title
 * - Interactive Question Detail modal with multi-company occurrences, notes, and direct LeetCode links
 * - Target goal integration
 */
export const CompanyPreparationPage: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const {
    currentCompany,
    isLoadingDetail,
    questions,
    totalQuestions,
    currentPage,
    totalPages,
    isLoadingQuestions,
    fetchCompanyDetail,
    fetchQuestions,
    updateQuestionStatus
  } = useCompanyDsaStore()

  const [activeTab, setActiveTab] = useState<PrepTab>('overview')

  // Filter & Search states
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timePeriodFilter, setTimePeriodFilter] = useState<TimePeriodKey>('all')
  const [sortBy, setSortBy] = useState<SortKey>('frequency')
  const [questionSearch, setQuestionSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  // Question Detail Modal state
  const [selectedQuestion, setSelectedQuestion] = useState<CompanyDsaQuestionItem | null>(null)
  const [detailedQuestionData, setDetailedQuestionData] = useState<QuestionDetail | null>(null)
  const [isLoadingQuestionDetail, setIsLoadingQuestionDetail] = useState<boolean>(false)
  const [modalNotes, setModalNotes] = useState<string>('')
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false)
  const [isSettingGoal, setIsSettingGoal] = useState<boolean>(false)

  // Fetch company metadata on mount / slug change
  useEffect(() => {
    if (companySlug) {
      fetchCompanyDetail(companySlug)
    }
  }, [companySlug, fetchCompanyDetail])

  // Fetch paginated questions whenever filters, time periods, sorting, or page change
  const loadQuestions = useCallback(() => {
    if (!companySlug) return
    fetchQuestions(companySlug, {
      topic: topicFilter !== 'all' ? topicFilter : undefined,
      difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      time_period: timePeriodFilter !== 'all' ? timePeriodFilter : undefined,
      sort_by: sortBy,
      search: questionSearch.trim() || undefined,
      page,
      page_size: 20
    })
  }, [
    companySlug,
    topicFilter,
    difficultyFilter,
    statusFilter,
    timePeriodFilter,
    sortBy,
    questionSearch,
    page,
    fetchQuestions
  ])

  useEffect(() => {
    if (companySlug) {
      loadQuestions()
    }
  }, [loadQuestions, companySlug])

  // Open question detail modal and fetch full metadata
  const handleOpenQuestionDetail = async (q: CompanyDsaQuestionItem) => {
    setSelectedQuestion(q)
    setModalNotes(q.notes || '')
    setIsLoadingQuestionDetail(true)

    try {
      const fullDetail = await companyDsaApi.getQuestionDetail(q.id)
      setDetailedQuestionData(fullDetail)
      if (fullDetail.notes !== null && fullDetail.notes !== undefined) {
        setModalNotes(fullDetail.notes)
      }
    } catch {
      // Fallback to basic question item if detail request encounters an issue
      setDetailedQuestionData(null)
    } finally {
      setIsLoadingQuestionDetail(false)
    }
  }

  // Close question detail modal
  const handleCloseModal = () => {
    setSelectedQuestion(null)
    setDetailedQuestionData(null)
    setModalNotes('')
  }

  // Save notes from modal
  const handleSaveModalNotes = async () => {
    if (!selectedQuestion) return
    setIsSavingNotes(true)
    try {
      await updateQuestionStatus(selectedQuestion.id, selectedQuestion.status, modalNotes)
      addToast('Notes saved successfully!', 'success')
      if (selectedQuestion) {
        setSelectedQuestion({ ...selectedQuestion, notes: modalNotes })
      }
    } catch {
      addToast('Failed to save notes.', 'error')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Update question status directly from table or modal
  const handleStatusChange = async (
    questionId: string,
    newStatus: 'not_started' | 'attempted' | 'solved' | 'needs_revision'
  ) => {
    await updateQuestionStatus(questionId, newStatus)
    if (selectedQuestion && selectedQuestion.id === questionId) {
      setSelectedQuestion({ ...selectedQuestion, status: newStatus })
    }
    addToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success')
  }

  // Quick jump to questions tab with selected topic filter
  const handleTopicClick = (topicName: string) => {
    setTopicFilter(topicName)
    setPage(1)
    setActiveTab('questions')
  }

  // Add this company to active goal targets
  const handleSetCompanyGoal = async () => {
    if (!currentCompany) return
    setIsSettingGoal(true)
    try {
      await companyDsaApi.createCompanyGoal([currentCompany.slug], `${currentCompany.name} Target Preparation`)
      addToast(`Added ${currentCompany.name} to your active preparation goals!`, 'success')
    } catch {
      addToast('Failed to create company goal.', 'error')
    } finally {
      setIsSettingGoal(false)
    }
  }

  if (isLoadingDetail && !currentCompany) {
    return (
      <div className="max-w-7xl mx-auto py-12 space-y-6">
        <div className="h-10 w-48 bg-bg-surface border border-border-default rounded-lg animate-pulse" />
        <div className="h-40 bg-bg-surface border border-border-default rounded-xl animate-pulse" />
        <div className="h-96 bg-bg-surface border border-border-default rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!currentCompany) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Company Not Found</h2>
        <p className="text-sm text-text-secondary">
          The requested company preparation directory could not be located.
        </p>
        <button
          onClick={() => navigate('/app/company-dsa')}
          className="px-4 py-2 text-xs font-mono bg-bg-surface border border-border-default rounded-md text-text-primary hover:border-text-primary cursor-pointer"
        >
          Return to Directory
        </button>
      </div>
    )
  }

  const diffBreakdown = currentCompany.difficulty_breakdown || {}
  const easyStat = diffBreakdown['easy'] || { total: 0, solved: 0 }
  const medStat = diffBreakdown['medium'] || { total: 0, solved: 0 }
  const hardStat = diffBreakdown['hard'] || { total: 0, solved: 0 }

  const timePeriodOptions: { key: TimePeriodKey; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'thirty_days', label: 'Last 30 Days' },
    { key: 'three_months', label: 'Last 3 Months' },
    { key: 'six_months', label: 'Last 6 Months' },
    { key: 'more_than_six_months', label: '> 6 Months' }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Breadcrumb & Back button ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/company-dsa')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Companies
        </button>

        <button
          onClick={handleSetCompanyGoal}
          disabled={isSettingGoal}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border-default bg-bg-surface hover:border-brand-primary text-xs font-mono font-medium text-text-primary transition-all cursor-pointer shadow-sm"
        >
          <Target className="w-3.5 h-3.5 text-brand-primary" />
          {isSettingGoal ? 'Adding Goal...' : 'Set as Goal Target'}
        </button>
      </div>

      {/* ── Preparation Banner & Summary ───────────────────────── */}
      <div className="p-6 rounded-2xl border border-border-default bg-bg-surface space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Official Company Logo Banner */}
            <CompanyLogo company={currentCompany} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
                  Target Interview Preparation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono tracking-tight">
                {currentCompany.name} Company DSA Preparation
              </h1>
            </div>
          </div>

          {/* Overall Progress Stat Badge */}
          <div className="flex items-center gap-3 bg-bg-base border border-border-default px-5 py-3 rounded-xl shrink-0">
            <div className="text-right">
              <div className="text-xs font-mono text-text-tertiary uppercase">Readiness</div>
              <div className="text-2xl font-mono font-black text-text-primary">
                {currentCompany.progress_percentage}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-border-default flex items-center justify-center font-mono text-xs font-bold text-brand-primary">
              ✓
            </div>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
            <span>Overall Preparation Progress</span>
            <span className="text-text-primary font-bold">
              {currentCompany.solved_count} of {currentCompany.question_count} Questions Solved
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-bg-base overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, currentCompany.progress_percentage)}%` }}
            />
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-border-subtle">
          <div className="p-3 rounded-lg bg-bg-base border border-border-default">
            <div className="text-[11px] font-mono text-text-tertiary uppercase">Total Questions</div>
            <div className="text-lg font-mono font-bold text-text-primary mt-0.5">
              {currentCompany.question_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-default">
            <div className="text-[11px] font-mono text-text-tertiary uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Solved
            </div>
            <div className="text-lg font-mono font-bold text-emerald-500 mt-0.5">
              {currentCompany.solved_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-default">
            <div className="text-[11px] font-mono text-text-tertiary uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Attempted
            </div>
            <div className="text-lg font-mono font-bold text-amber-500 mt-0.5">
              {currentCompany.attempted_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-default">
            <div className="text-[11px] font-mono text-text-tertiary uppercase flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-violet-400" /> Revision
            </div>
            <div className="text-lg font-mono font-bold text-violet-400 mt-0.5">
              {currentCompany.needs_revision_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-bg-base border border-border-default col-span-2 sm:col-span-1">
            <div className="text-[11px] font-mono text-text-tertiary uppercase">Remaining</div>
            <div className="text-lg font-mono font-bold text-text-secondary mt-0.5">
              {currentCompany.remaining_count}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border-default">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-brand-primary text-text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'border-brand-primary text-text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Questions ({currentCompany.question_count})
        </button>

        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'topics'
              ? 'border-brand-primary text-text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-primary'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Topics ({currentCompany.topic_breakdown?.length || 0})
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Difficulty Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Easy */}
            <div className="p-5 rounded-xl border border-border-default bg-bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500">
                  Easy
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  {easyStat.solved} / {easyStat.total} solved
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-text-primary">{easyStat.total} Questions</div>
              <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${easyStat.total ? Math.round((easyStat.solved / easyStat.total) * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="p-5 rounded-xl border border-border-default bg-bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                  Medium
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  {medStat.solved} / {medStat.total} solved
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-text-primary">{medStat.total} Questions</div>
              <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${medStat.total ? Math.round((medStat.solved / medStat.total) * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="p-5 rounded-xl border border-border-default bg-bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-500">
                  Hard
                </span>
                <span className="text-xs font-mono text-text-tertiary">
                  {hardStat.solved} / {hardStat.total} solved
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-text-primary">{hardStat.total} Questions</div>
              <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${hardStat.total ? Math.round((hardStat.solved / hardStat.total) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Top Topics Section */}
          <div className="p-6 rounded-xl border border-border-default bg-bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary font-mono">
                  Primary DSA Topics Tested
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Core algorithm categories extracted from this company's interview dataset.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('topics')}
                className="text-xs font-mono text-brand-primary hover:underline cursor-pointer"
              >
                View all topics →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(currentCompany.topic_breakdown || []).slice(0, 9).map((t) => (
                <button
                  key={t.topic}
                  onClick={() => handleTopicClick(t.topic)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-default bg-bg-base hover:border-text-secondary transition-all text-left group cursor-pointer"
                >
                  <div className="truncate mr-2">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-brand-primary transition-colors">
                      {t.topic}
                    </span>
                    <div className="text-[11px] font-mono text-text-tertiary">
                      {t.solved} / {t.total} solved ({t.progress}%)
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: QUESTIONS ───────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Questions Filter Bar */}
          <div className="p-4 rounded-xl border border-border-default bg-bg-surface space-y-3">
            {/* Top Row: Search & Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search questions by title..."
                  value={questionSearch}
                  onChange={(e) => {
                    setQuestionSearch(e.target.value)
                    setPage(1)
                  }}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-bg-base border border-border-default rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Topic Filter */}
              <select
                value={topicFilter}
                onChange={(e) => {
                  setTopicFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-mono bg-bg-base border border-border-default rounded-md text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
              >
                <option value="all">All Topics</option>
                {(currentCompany.topic_breakdown || []).map((t) => (
                  <option key={t.topic} value={t.topic}>
                    {t.topic} ({t.total})
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-mono bg-bg-base border border-border-default rounded-md text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-3 text-xs font-mono bg-bg-base border border-border-default rounded-md text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="attempted">Attempted</option>
                <option value="solved">Solved</option>
                <option value="needs_revision">Needs Revision</option>
              </select>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortKey)
                    setPage(1)
                  }}
                  className="h-9 px-3 text-xs font-mono bg-bg-base border border-border-default rounded-md text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="frequency">Sort: Frequency</option>
                  <option value="difficulty">Sort: Difficulty</option>
                  <option value="title">Sort: Title</option>
                </select>
              </div>

              {(topicFilter !== 'all' ||
                difficultyFilter !== 'all' ||
                statusFilter !== 'all' ||
                timePeriodFilter !== 'all' ||
                sortBy !== 'frequency' ||
                questionSearch) && (
                <button
                  onClick={() => {
                    setTopicFilter('all')
                    setDifficultyFilter('all')
                    setStatusFilter('all')
                    setTimePeriodFilter('all')
                    setSortBy('frequency')
                    setQuestionSearch('')
                    setPage(1)
                  }}
                  className="text-xs font-mono text-text-tertiary hover:text-text-primary px-2 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Bottom Row: Time-Period Filter Pills */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary flex items-center gap-1 shrink-0 mr-1">
                <Calendar className="w-3 h-3" /> Time Period:
              </span>
              {timePeriodOptions.map((tp) => (
                <button
                  key={tp.key}
                  onClick={() => {
                    setTimePeriodFilter(tp.key)
                    setPage(1)
                  }}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    timePeriodFilter === tp.key
                      ? 'bg-primary text-text-inverse font-bold shadow-sm'
                      : 'bg-bg-base text-text-secondary border border-border-default hover:text-text-primary hover:border-border-strong'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Table */}
          <div className="rounded-xl border border-border-default bg-bg-surface overflow-hidden">
            {isLoadingQuestions ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-bg-base/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="p-12 text-center text-text-secondary space-y-2">
                <ListTodo className="w-8 h-8 text-text-tertiary mx-auto opacity-40" />
                <div className="text-sm font-semibold text-text-primary">No questions found</div>
                <div className="text-xs">Try clearing or adjusting your search filters or time period.</div>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {questions.map((q) => {
                  const diffColor =
                    q.difficulty.toLowerCase() === 'easy'
                      ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
                      : q.difficulty.toLowerCase() === 'hard'
                      ? 'text-red-500 border-red-500/30 bg-red-500/5'
                      : 'text-amber-500 border-amber-500/30 bg-amber-500/5'

                  return (
                    <div
                      key={q.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-bg-container-low/40 transition-colors group/item"
                    >
                      {/* Left: Title, Tags, Frequency */}
                      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${diffColor}`}
                          >
                            {q.difficulty}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenQuestionDetail(q)}
                            className="text-sm font-semibold text-text-primary hover:text-brand-primary truncate text-left cursor-pointer transition-colors"
                          >
                            {q.title}
                          </button>

                          {q.platform_url && (
                            <a
                              href={q.platform_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-primary hover:underline ml-1"
                            >
                              Practice <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Topics, Ask Count & Frequency */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.topics.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-bg-base border border-border-default text-text-secondary"
                            >
                              {t}
                            </span>
                          ))}

                          {q.companies.length > 1 && (
                            <span className="text-[10px] font-mono text-text-tertiary">
                              • Also asked by {q.companies.length - 1} other companies
                            </span>
                          )}

                          {q.frequency && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                              Freq: {q.frequency}
                            </span>
                          )}

                          {q.notes && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded border border-violet-400/20">
                              <FileText className="w-2.5 h-2.5" /> Note
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions & Status Selector */}
                      <div className="shrink-0 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionDetail(q)}
                          className="px-2.5 py-1 text-xs font-mono border border-border-default rounded-md text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        <select
                          value={q.status}
                          onChange={(e) => handleStatusChange(q.id, e.target.value as any)}
                          className={`h-8 px-2.5 text-xs font-mono font-medium rounded-md border transition-colors focus:outline-none cursor-pointer ${
                            q.status === 'solved'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : q.status === 'attempted'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : q.status === 'needs_revision'
                              ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                              : 'bg-bg-base text-text-secondary border-border-default hover:text-text-primary'
                          }`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="attempted">Attempted</option>
                          <option value="solved">Solved</option>
                          <option value="needs_revision">Needs Revision</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                <span className="text-text-tertiary">
                  Page {currentPage} of {totalPages} ({totalQuestions} total)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-border-default disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-base cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded border border-border-default disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-base cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: TOPICS ──────────────────────────────────────── */}
      {activeTab === 'topics' && (
        <div className="rounded-xl border border-border-default bg-bg-surface overflow-hidden">
          <div className="p-4 border-b border-border-default">
            <h3 className="text-sm font-bold text-text-primary font-mono">
              Topic Breakdown for {currentCompany.name}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Click any topic to practice questions specific to that domain.
            </p>
          </div>

          <div className="divide-y divide-border-subtle">
            {(currentCompany.topic_breakdown || []).map((t) => (
              <div
                key={t.topic}
                className="p-4 flex items-center justify-between hover:bg-bg-container-low/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 pr-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary font-mono">{t.topic}</span>
                    <span className="text-xs font-mono text-text-secondary">
                      {t.solved} / {t.total} solved ({t.progress}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleTopicClick(t.topic)}
                  className="px-3 py-1.5 text-xs font-mono bg-bg-base border border-border-default rounded-md text-text-secondary hover:text-text-primary hover:border-text-primary shrink-0 transition-colors cursor-pointer"
                >
                  View Questions →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUESTION DETAIL MODAL ──────────────────────────────── */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-border-default rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-default flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                      selectedQuestion.difficulty.toLowerCase() === 'easy'
                        ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
                        : selectedQuestion.difficulty.toLowerCase() === 'hard'
                        ? 'text-red-500 border-red-500/30 bg-red-500/5'
                        : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                    }`}
                  >
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">
                    {currentCompany.name} DSA Question
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary font-mono">
                  {selectedQuestion.title}
                </h3>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg border border-transparent hover:border-border-default transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* External Practice Link */}
              {selectedQuestion.platform_url && (
                <div className="p-3.5 rounded-xl bg-bg-base border border-border-default flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-brand-primary" />
                    <span className="text-text-secondary font-sans font-medium">LeetCode Problem Link</span>
                  </div>
                  <a
                    href={selectedQuestion.platform_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-primary text-text-inverse rounded-md text-xs font-bold hover:bg-secondary transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    Open Problem <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Your Preparation Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'not_started', label: 'Not Started' },
                      { key: 'attempted', label: 'Attempted' },
                      { key: 'solved', label: 'Solved' },
                      { key: 'needs_revision', label: 'Needs Revision' }
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleStatusChange(selectedQuestion.id, s.key)}
                      className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                        selectedQuestion.status === s.key
                          ? 'border-primary bg-primary text-text-inverse shadow-sm'
                          : 'border-border-default bg-bg-base text-text-secondary hover:text-text-primary hover:border-border-strong'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics Breakdown */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Topics & Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedQuestion.topics.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-bg-base border border-border-default text-text-secondary text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-Company Occurrences */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Also Asked by Companies ({(detailedQuestionData?.companies || selectedQuestion.companies).length})
                </label>
                {isLoadingQuestionDetail ? (
                  <div className="h-12 rounded-lg bg-bg-base animate-pulse border border-border-default" />
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg bg-bg-base border border-border-default">
                    {(detailedQuestionData?.companies || selectedQuestion.companies).map((compName) => (
                      <div
                        key={compName}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface border border-border-default text-[11px] text-text-primary"
                      >
                        <CompanyLogo company={compName} size="xs" showContainer={false} className="w-3.5 h-3.5" />
                        <span>{compName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notes */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block flex items-center justify-between">
                  <span>Your Study Notes & Edge Cases</span>
                  {selectedQuestion.notes && <span className="text-emerald-500">Saved</span>}
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record your algorithm intuition, time/space complexity notes, and edge cases to review later..."
                  className="w-full h-28 p-3 rounded-lg bg-bg-base border border-border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary text-xs resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-default flex items-center justify-between bg-bg-surface">
              <span className="text-[11px] font-mono text-text-tertiary">
                Changes to status and notes sync across your entire preparation tracker.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-border-default text-xs font-mono text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 rounded-lg bg-primary text-text-inverse text-xs font-mono font-bold hover:bg-secondary transition-colors cursor-pointer shadow-sm"
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default CompanyPreparationPage
