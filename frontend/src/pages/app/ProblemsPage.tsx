import { useEffect, useState, useDeferredValue } from 'react'
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Code2, 
  Search, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal
} from 'lucide-react'
import { useProblemStore } from '@/store/problem.store'
import { useToastStore } from '@/store/toast.store'
import { ProblemModal } from '@/components/problems/ProblemModal'
import { StatusBadge } from '@/components/problems/StatusBadge'
import { DifficultyBadge } from '@/components/problems/DifficultyBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ProblemsSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Problem, Difficulty, Status, Platform } from '@/services/api/problem'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProblemsPage() {
  const { 
    problems, 
    isLoading, 
    fetchProblems, 
    addProblem,
    removeProblem, 
    removeProblemsBulk,  
    toggleBookmark 
  } = useProblemStore()
  
  const { addToast } = useToastStore()

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [problemToEdit, setProblemToEdit] = useState<Problem | undefined>(undefined)

  // Query / Filter / Pagination States
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)
  
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites'>('all')
  
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Confirmation Dialog States
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch problems on filters, sorting, or page change
  useEffect(() => {
    const params: any = {
      sort_by: sortBy,
      sort_order: sortOrder,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    }
    
    if (deferredSearch.trim()) params.search = deferredSearch
    if (difficultyFilter !== 'all') params.difficulty = difficultyFilter
    if (statusFilter !== 'all') params.status = statusFilter
    if (platformFilter !== 'all') params.platform = platformFilter
    if (favoriteFilter === 'favorites') params.is_bookmarked = true

    fetchProblems(params)
  }, [
    deferredSearch, 
    difficultyFilter, 
    statusFilter, 
    platformFilter, 
    favoriteFilter, 
    sortBy, 
    sortOrder, 
    currentPage, 
    fetchProblems
  ])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearch, difficultyFilter, statusFilter, platformFilter, favoriteFilter])

  const handleAdd = () => {
    setProblemToEdit(undefined)
    setIsModalOpen(true)
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('add') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname)
      handleAdd()
    }
  }, [])

  const handleEdit = (problem: Problem) => {
    setProblemToEdit(problem)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
  }

  const handleConfirmSingleDelete = async () => {
    if (!deleteTargetId) return
    const deletedProblem = problems.find(p => p.id === deleteTargetId)
    if (!deletedProblem) return

    setIsActionLoading(true)
    try {
      await removeProblem(deleteTargetId)
      
      // Setup soft Undo action caching details
      addToast('Problem deleted.', 'success', async () => {
        try {
          const { id: _id, user_id: _uid, created_at: _cat, updated_at: _uat, ...createData } = deletedProblem
          await addProblem(createData)
          addToast('Problem restored.', 'success')
        } catch (err) {
          addToast('Failed to restore problem.', 'error')
        }
      })
      
      setDeleteTargetId(null)
      setSelectedIds(prev => prev.filter(item => item !== deleteTargetId))
    } catch (err: any) {
      addToast(err.message || 'Failed to delete problem', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const deletedProblems = problems.filter(p => selectedIds.includes(p.id))

    setIsActionLoading(true)
    try {
      await removeProblemsBulk(selectedIds)
      
      // Setup soft Undo action caching details
      addToast(`${selectedIds.length} problems deleted.`, 'success', async () => {
        try {
          await Promise.all(deletedProblems.map(p => {
            const { id: _id, user_id: _uid, created_at: _cat, updated_at: _uat, ...createData } = p
            return addProblem(createData)
          }))
          addToast('Selected problems restored.', 'success')
        } catch (err) {
          addToast('Failed to restore problems.', 'error')
        }
      })

      setSelectedIds([])
      setIsBulkDeleteConfirmOpen(false)
    } catch (err: any) {
      addToast(err.message || 'Failed to delete selected problems', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleToggleBookmark = async (id: string) => {
    try {
      await toggleBookmark(id)
      addToast('Bookmark updated!', 'success')
    } catch (err: any) {
      addToast('Failed to update bookmark status', 'error')
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === problems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(problems.map(p => p.id))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Header (Nothing OS monochrome accents) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Code2 className="w-6 h-6 text-text-primary" />
            Problem Tracker
          </h1>
          <p className="text-text-secondary text-xs mt-1">Manage and track your coding problems.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-text-primary hover:bg-text-secondary text-bg-base px-4 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-border-default rounded-md p-5 space-y-4 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search problems by name or topic..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-bg-container-low border border-border-default rounded-md pl-9 pr-4 py-2 text-sm text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value as any)}
              className="bg-bg-container-low border border-border-default rounded-md px-3 py-2 text-xs font-mono font-bold text-text-secondary outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">DIFFICULTY: ALL</option>
              <option value="easy">EASY</option>
              <option value="medium">MEDIUM</option>
              <option value="hard">HARD</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-bg-container-low border border-border-default rounded-md px-3 py-2 text-xs font-mono font-bold text-text-secondary outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">STATUS: ALL</option>
              <option value="attempted">ATTEMPTED</option>
              <option value="solved">SOLVED</option>
              <option value="revisit">REVISIT</option>
              <option value="skipped">SKIPPED</option>
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value as any)}
              className="bg-bg-container-low border border-border-default rounded-md px-3 py-2 text-xs font-mono font-bold text-text-secondary outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">PLATFORM: ALL</option>
              <option value="leetcode">LEETCODE</option>
              <option value="gfg">GFG</option>
              <option value="hackerrank">HACKERRANK</option>
              <option value="codeforces">CODEFORCES</option>
              <option value="interviewbit">INTERVIEWBIT</option>
              <option value="other">OTHER</option>
            </select>

            {/* Bookmark Filter */}
            <select
              value={favoriteFilter}
              onChange={e => setFavoriteFilter(e.target.value as any)}
              className="bg-bg-container-low border border-border-default rounded-md px-3 py-2 text-xs font-mono font-bold text-text-secondary outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">BOOKMARKS: ALL</option>
              <option value="favorites">BOOKMARKED</option>
            </select>
          </div>
        </div>

        {/* Sorting controls & Selected Bulk Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-border-default">
          <div className="flex items-center gap-3 text-xs font-mono text-text-secondary uppercase">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-tertiary" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-none text-text-primary outline-none cursor-pointer font-bold"
            >
              <option value="created_at" className="bg-bg-surface">DATE ADDED</option>
              <option value="title" className="bg-bg-surface">TITLE</option>
              <option value="difficulty" className="bg-bg-surface">DIFFICULTY</option>
              <option value="status" className="bg-bg-surface">STATUS</option>
              <option value="platform" className="bg-bg-surface">PLATFORM</option>
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="text-text-tertiary hover:text-text-primary font-bold transition-colors cursor-pointer"
            >
              ({sortOrder.toUpperCase()})
            </button>
          </div>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 w-full sm:w-auto"
              >
                <span className="text-xs font-mono font-bold text-text-secondary uppercase">
                  {selectedIds.length} SELECTED
                </span>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 border border-error/20 text-error text-xs font-mono font-bold uppercase rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Problems Table Container */}
      <div className="bg-white border border-border-default rounded-md overflow-hidden shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
        {isLoading && problems.length === 0 ? (
          <ProblemsSkeleton />
        ) : problems.length === 0 ? (
          <EmptyState
            title="No problems found"
            description="Adjust your search query or filter tags to find matching items, or add a new DSA coding problem to your tracker."
            actionLabel="Add Problem"
            onAction={handleAdd}
            iconType="problems"
          />
        ) : (
          /* Table View */
          <div className="overflow-x-auto custom-scrollbar mt-1">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-bg-container-low text-text-secondary text-[10px] font-mono uppercase tracking-wider border-b border-border-default select-none">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === problems.length && problems.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border-default bg-white text-primary focus:ring-primary cursor-pointer focus:outline-none"
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">Problem</th>
                  <th className="px-6 py-4 font-bold">Topic</th>
                  <th className="px-6 py-4 font-bold">Platform</th>
                  <th className="px-6 py-4 font-bold">Difficulty</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date Added</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {problems.map((problem) => {
                  const isChecked = selectedIds.includes(problem.id)
                  return (
                    <tr 
                      key={problem.id} 
                      className={`hover:bg-bg-container-low/40 transition-colors group ${
                        isChecked ? 'bg-bg-container-low' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(problem.id)}
                          className="w-4 h-4 rounded border-border-default bg-white text-primary focus:ring-primary cursor-pointer focus:outline-none"
                        />
                      </td>

                      {/* Title & Star Bookmark */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleBookmark(problem.id)}
                            className={`p-1 rounded hover:bg-bg-container-high transition-colors cursor-pointer focus:outline-none ${
                              problem.is_bookmarked ? 'text-amber-500' : 'text-text-tertiary hover:text-primary'
                            }`}
                            aria-label={problem.is_bookmarked ? 'Remove bookmark' : 'Bookmark problem'}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary text-sm">{problem.title}</span>
                            {problem.platform_url && (
                              <a
                                href={problem.platform_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                                title="Open Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono uppercase">
                        {problem.topic ? (
                          <span className="px-2 py-0.5 bg-white/5 border border-border-subtle rounded">
                            {problem.topic}
                          </span>
                        ) : '-'}
                      </td>

                      {/* Platform */}
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono uppercase">
                        {problem.platform}
                      </td>

                      {/* Difficulty Badge */}
                      <td className="px-6 py-4">
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <StatusBadge status={problem.status} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono">
                        {problem.created_at ? formatDate(problem.created_at) : '-'}
                      </td>

                      {/* Row Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(problem)}
                            className="p-1.5 text-text-tertiary hover:text-primary hover:bg-bg-container-high rounded transition-colors cursor-pointer focus:outline-none"
                            title="Edit"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(problem.id)}
                            className="p-1.5 text-text-tertiary hover:text-secondary hover:bg-secondary/10 rounded transition-colors cursor-pointer focus:outline-none"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {problems.length > 0 && (
          <div className="px-6 py-4 border-t border-border-default bg-bg-container-low/20 flex items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-text-tertiary uppercase">
              Page {currentPage} (Limit {itemsPerPage})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 bg-bg-container-low border border-border-default text-text-secondary hover:text-primary disabled:opacity-40 rounded cursor-pointer transition-colors focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={problems.length < itemsPerPage || isLoading}
                className="p-1.5 bg-bg-container-low border border-border-default text-text-secondary hover:text-primary disabled:opacity-40 rounded cursor-pointer transition-colors focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      <ProblemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        problemToEdit={problemToEdit}
      />

      {/* Universal Reusable Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Problem"
        message="Are you sure you want to permanently delete this problem entry? This action cannot be undone."
        confirmText="Delete Problem"
        isDangerous
        isLoading={isActionLoading}
      />

      {/* Universal Reusable Bulk Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Problems"
        message={`Are you sure you want to permanently delete these ${selectedIds.length} selected problem entries? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Problems`}
        isDangerous
        isLoading={isActionLoading}
      />
    </motion.div>
  )
}
