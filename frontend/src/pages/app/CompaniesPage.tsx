import { useEffect, useState, useDeferredValue } from 'react'
import { 
  Plus, 
  Building2, 
  ExternalLink, 
  Trash2, 
  Calendar, 
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Sliders
} from 'lucide-react'
import { useCompanyStore } from '@/store/company.store'
import { useToastStore } from '@/store/toast.store'
import { CompanyModal } from '@/components/companies/CompanyModal'
import { CompanyDetailsDrawer } from '@/components/companies/CompanyDetailsDrawer'
import { CompanyStatusBadge } from '@/components/companies/CompanyStatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CompaniesSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import { Company, CompanyCreate } from '@/services/api/company'
import { motion, AnimatePresence } from 'framer-motion'

export default function CompaniesPage() {
  const { 
    companies, 
    isLoading, 
    fetchCompanies, 
    addCompany, 
    editCompany, 
    removeCompany,
    removeCompaniesBulk 
  } = useCompanyStore()
  
  const { addToast } = useToastStore()

  // Modal / Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<Company | undefined>(undefined)
  const [selectedCompanyForDrawer, setSelectedCompanyForDrawer] = useState<Company | null>(null)

  // Query & Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)
  
  const [statusFilter, setStatusFilter] = useState<Company['status'] | 'all'>('all')
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

  // Fetch companies when query parameters change
  useEffect(() => {
    const params: any = {
      sort_by: sortBy,
      sort_order: sortOrder,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    }
    
    if (deferredSearch.trim()) params.search = deferredSearch
    if (statusFilter !== 'all') params.status = statusFilter

    fetchCompanies(params)
  }, [deferredSearch, statusFilter, sortBy, sortOrder, currentPage, fetchCompanies])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearch, statusFilter])

  // Keep selected company details in sync if modified
  useEffect(() => {
    if (selectedCompanyForDrawer) {
      const updated = companies.find(c => c.id === selectedCompanyForDrawer.id)
      if (updated) {
        setSelectedCompanyForDrawer(updated)
      } else {
        setSelectedCompanyForDrawer(null)
      }
    }
  }, [companies, selectedCompanyForDrawer])

  const handleOpenModal = (company?: Company) => {
    setCompanyToEdit(company)
    setIsModalOpen(true)
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('add') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname)
      handleOpenModal()
    }
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCompanyToEdit(undefined)
  }

  const handleSubmit = async (formData: CompanyCreate | Company) => {
    if (companyToEdit) {
      await editCompany(companyToEdit.id, formData)
    } else {
      await addCompany(formData as CompanyCreate)
    }
    handleCloseModal()
  }

  const handleDeleteClick = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation() // Don't trigger row click drawer
    setDeleteTargetId(id)
  }

  const handleConfirmSingleDelete = async () => {
    if (!deleteTargetId) return
    const deletedCompany = companies.find(c => c.id === deleteTargetId)
    if (!deletedCompany) return

    setIsActionLoading(true)
    try {
      await removeCompany(deleteTargetId)
      
      // Setup soft Undo action caching details
      addToast('Company deleted.', 'success', async () => {
        try {
          const { id: _id, createdAt: _cat, updatedAt: _uat, ...createData } = deletedCompany
          await addCompany(createData)
          addToast('Company restored.', 'success')
        } catch {
          addToast('Failed to restore company.', 'error')
        }
      })

      setDeleteTargetId(null)
      setSelectedIds(prev => prev.filter(item => item !== deleteTargetId))
      if (selectedCompanyForDrawer?.id === deleteTargetId) {
        setSelectedCompanyForDrawer(null)
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete company', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const deletedCompanies = companies.filter(c => selectedIds.includes(c.id))

    setIsActionLoading(true)
    try {
      await removeCompaniesBulk(selectedIds)
      
      // Setup soft Undo action caching details
      addToast(`${selectedIds.length} companies deleted.`, 'success', async () => {
        try {
          await Promise.all(deletedCompanies.map(c => {
            const { id: _id, createdAt: _cat, updatedAt: _uat, ...createData } = c
            return addCompany(createData)
          }))
          addToast('Selected companies restored.', 'success')
        } catch {
          addToast('Failed to restore companies.', 'error')
        }
      })

      setSelectedIds([])
      setIsBulkDeleteConfirmOpen(false)
      if (selectedCompanyForDrawer && selectedIds.includes(selectedCompanyForDrawer.id)) {
        setSelectedCompanyForDrawer(null)
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete selected companies', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    e.stopPropagation() // Don't trigger row click drawer
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === companies.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(companies.map(c => c.id))
    }
  }

  const handleRowClick = (company: Company) => {
    setSelectedCompanyForDrawer(company)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-text-primary" />
            Company Pipeline
          </h1>
          <p className="text-text-secondary text-xs mt-1">Track your job applications and interviews.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-text-inverse rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer shrink-0 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-bg-surface border border-border-default rounded-md p-5 space-y-4 shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center mt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search companies by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-bg-container-low border border-border-default rounded-md pl-9 pr-4 py-2 text-sm text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-bg-container-low border border-border-default rounded-md px-4 py-2 text-xs font-mono font-bold text-text-secondary outline-none focus:border-primary transition-colors cursor-pointer min-w-[160px]"
            >
              <option value="all">STATUS: ALL</option>
              <option value="wishlist">WISHLIST</option>
              <option value="applied">APPLIED</option>
              <option value="interviewing">INTERVIEWING</option>
              <option value="offered">OFFERED</option>
              <option value="rejected">REJECTED</option>
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
              className="bg-transparent border-none text-text-primary outline-none cursor-pointer font-bold animate-fade-in"
            >
              <option value="created_at" className="bg-bg-surface">DATE TRACKED</option>
              <option value="name" className="bg-bg-surface">COMPANY NAME</option>
              <option value="status" className="bg-bg-surface">STATUS</option>
              <option value="appliedDate" className="bg-bg-surface">APPLIED DATE</option>
              <option value="interviewDate" className="bg-bg-surface">INTERVIEW DATE</option>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 border border-error/20 text-error text-xs font-mono font-bold uppercase rounded-md transition-colors cursor-pointer focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Companies Container */}
      <div className="bg-bg-surface border border-border-default rounded-md overflow-hidden shadow-sm relative group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>
        {isLoading && companies.length === 0 ? (
          <CompaniesSkeleton />
        ) : companies.length === 0 ? (
          <EmptyState
            title="No companies tracked"
            description="Adjust your search query or filter tags to find matching items, or start tracking job applications by adding your first company to the pipeline."
            actionLabel="Add Company"
            onAction={() => handleOpenModal()}
            iconType="companies"
          />
        ) : (
          /* Pipeline List Table */
          <div className="overflow-x-auto custom-scrollbar mt-1">
            <table className="w-full text-left whitespace-nowrap border-collapse">
              <thead className="bg-bg-container-low text-text-secondary text-[10px] font-mono uppercase tracking-wider border-b border-border-default select-none">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === companies.length && companies.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border-default bg-bg-container-low text-primary focus:ring-primary cursor-pointer focus:outline-none"
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">Company</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Applied</th>
                  <th className="px-6 py-4 font-bold">Interview</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {companies.map((company) => {
                  const isChecked = selectedIds.includes(company.id)
                  return (
                    <tr 
                      key={company.id} 
                      onClick={() => handleRowClick(company)}
                      className={`hover:bg-bg-container-low/40 transition-colors group cursor-pointer ${
                        isChecked ? 'bg-bg-container-low' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(company.id, e)}
                          className="w-4 h-4 rounded border-border-default bg-bg-container-low text-primary focus:ring-primary cursor-pointer focus:outline-none"
                        />
                      </td>

                      {/* Name & link */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo company={company.name} size="sm" />
                          <div>
                            <div className="font-semibold text-primary text-sm flex items-center gap-2">
                              {company.name}
                              {company.jobUrl && (
                                <a 
                                  href={company.jobUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={e => e.stopPropagation()} // Don't open drawer
                                  className="text-text-tertiary hover:text-primary transition-colors focus:outline-none"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {company.tierCategory && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                  {company.tierCategory}
                                </span>
                              )}
                              {company.salaryRange && (
                                <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide">
                                  {company.salaryRange}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                          <Briefcase className="w-4 h-4 text-text-tertiary" />
                          <span>{company.role}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <CompanyStatusBadge status={company.status} />
                      </td>

                      {/* Applied Date */}
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono">
                        {company.appliedDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-text-tertiary" />
                            <span>{new Date(company.appliedDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>

                      {/* Interview Date */}
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono">
                        {company.interviewDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-text-tertiary" />
                            <span>{new Date(company.interviewDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>

                      {/* Row actions */}
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(company)}
                            className="p-1.5 text-text-tertiary hover:text-primary hover:bg-bg-container-high rounded transition-colors cursor-pointer focus:outline-none"
                            title="Edit Details"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(company.id, e)}
                            className="p-1.5 text-text-tertiary hover:text-secondary hover:bg-secondary/10 rounded transition-colors cursor-pointer focus:outline-none"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Controls */}
        {companies.length > 0 && (
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
                disabled={companies.length < itemsPerPage || isLoading}
                className="p-1.5 bg-bg-container-low border border-border-default text-text-secondary hover:text-primary disabled:opacity-40 rounded cursor-pointer transition-colors focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Side Drawer details view */}
      <AnimatePresence>
        {selectedCompanyForDrawer && (
          <CompanyDetailsDrawer
            isOpen={selectedCompanyForDrawer !== null}
            onClose={() => setSelectedCompanyForDrawer(null)}
            company={selectedCompanyForDrawer}
            onEditClick={(company) => handleOpenModal(company)}
            onDeleteClick={(id) => handleDeleteClick(id)}
          />
        )}
      </AnimatePresence>

      {/* Modals & Dialogs */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        companyToEdit={companyToEdit}
      />

      {/* Reusable Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Company"
        message="Are you sure you want to permanently delete this company and all associated tracker data? This action cannot be undone."
        confirmText="Delete Company"
        isDangerous
        isLoading={isActionLoading}
      />

      {/* Reusable Bulk Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Companies"
        message={`Are you sure you want to permanently delete the ${selectedIds.length} selected company entries? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Companies`}
        isDangerous
        isLoading={isActionLoading}
      />
    </motion.div>
  )
}
