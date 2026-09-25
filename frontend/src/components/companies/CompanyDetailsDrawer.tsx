import { useState, useEffect } from 'react'
import { 
  X, 
  Link as LinkIcon, 
  DollarSign, 
  FileText, 
  Trash2, 
  CheckCircle,
  Sliders,
  Sparkles
} from 'lucide-react'
import { Company, CompanyUpdate } from '@/services/api/company'
import { useCompanyStore } from '@/store/company.store'
import { useToastStore } from '@/store/toast.store'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import { motion } from 'framer-motion'

interface CompanyDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  company: Company | null
  onEditClick: (company: Company) => void
  onDeleteClick: (id: string) => void
}

export function CompanyDetailsDrawer({
  isOpen,
  onClose,
  company,
  onEditClick,
  onDeleteClick
}: CompanyDetailsDrawerProps) {
  const { editCompany } = useCompanyStore()
  const { addToast } = useToastStore()
  
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Sync notes when company changes
  useEffect(() => {
    if (company) {
      setNotes(company.notes || '')
    }
  }, [company])

  // Debounced auto-save notes
  useEffect(() => {
    if (!company) return
    if (notes === (company.notes || '')) return

    const saveTimeout = setTimeout(async () => {
      setIsSavingNotes(true)
      try {
        await editCompany(company.id, { notes })
        addToast('Notes autosaved', 'success')
      } catch {
        addToast('Failed to autosave notes', 'error')
      } finally {
        setIsSavingNotes(false)
      }
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [notes, company, editCompany, addToast])

  if (!isOpen || !company) return null

  const handleStatusChange = async (status: Company['status']) => {
    try {
      const payload: CompanyUpdate = { status }
      // Automatically record date if status changed
      if (status === 'applied' && !company.appliedDate) {
        payload.appliedDate = new Date().toISOString().split('T')[0]
      } else if (status === 'interviewing' && !company.interviewDate) {
        payload.interviewDate = new Date().toISOString().split('T')[0]
      }
      
      await editCompany(company.id, payload)
      addToast(`Status updated to ${status}!`, 'success')
    } catch {
      addToast('Failed to update status', 'error')
    }
  }

  const timelineSteps: { status: Company['status']; label: string; description: string }[] = [
    { status: 'wishlist', label: 'Wishlist', description: 'Adding to pipeline' },
    { status: 'applied', label: 'Applied', description: company.appliedDate ? `Applied on ${company.appliedDate}` : 'Job application submitted' },
    { status: 'interviewing', label: 'Interviewing', description: company.interviewDate ? `Interview on ${company.interviewDate}` : 'Interviews in progress' },
    { status: 'offered', label: 'Offer Received', description: 'Congratulations! Offer extended' },
  ]

  // Determine current active step index
  const getActiveIndex = () => {
    if (company.status === 'rejected') return -1
    if (company.status === 'offered') return 3
    if (company.status === 'interviewing') return 2
    if (company.status === 'applied') return 1
    return 0
  }

  const activeIndex = getActiveIndex()

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-lg bg-bg-surface border-l border-border-default shadow-glow-lg flex flex-col h-full"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-default flex items-center justify-between bg-bg-container-low/20">
            <div className="flex items-center gap-3">
              <CompanyLogo company={company.name} size="md" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">{company.name}</h2>
                <p className="text-xs text-text-secondary">{company.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditClick(company)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-container-high rounded-lg transition-colors cursor-pointer"
                title="Edit Details"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteClick(company.id)}
                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Company"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-container-high rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-bg-container-low border border-border-default rounded-xl text-sm">
              <div>
                <span className="text-text-tertiary block mb-1">Salary Range</span>
                <span className="text-text-primary font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-violet-400" />
                  {company.salaryRange || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary block mb-1">Job Link</span>
                {company.jobUrl ? (
                  <a 
                    href={company.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Apply Link
                  </a>
                ) : (
                  <span className="text-text-secondary font-medium">None</span>
                )}
              </div>
            </div>

            {/* Quick Status Selector */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary">Pipeline Status</h3>
              <div className="flex flex-wrap gap-2">
                {(['wishlist', 'applied', 'interviewing', 'offered', 'rejected'] as const).map((status) => {
                  const isActive = company.status === status
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize
                        ${isActive ? 
                          status === 'offered' ? 'bg-success/15 border-success/30 text-success' :
                          status === 'rejected' ? 'bg-error/15 border-error/30 text-error' :
                          status === 'interviewing' ? 'bg-info/15 border-info/30 text-info' :
                          'bg-primary/15 border-primary/30 text-primary'
                          : 'bg-bg-container-low border-border-default text-text-secondary hover:bg-bg-container-high hover:border-text-primary'}
                      `}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Visual Timeline / Interview Progress */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary">Progression Timeline</h3>
              
              <div className="relative pl-6 space-y-6">
                {/* Timeline vertical bar */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />

                {timelineSteps.map((step, idx) => {
                  const isCompleted = activeIndex >= idx
                  const isCurrent = activeIndex === idx
                  
                  return (
                    <div key={idx} className="relative flex gap-4">
                      {/* Step bullet */}
                      <span className={`
                        absolute -left-[20px] top-1 w-5.5 h-5.5 rounded-full flex items-center justify-center z-10 border transition-all
                        ${isCompleted ? 'bg-primary border-primary text-text-inverse shadow-sm' : 
                          'bg-bg-surface border-border-default text-text-tertiary'}
                      `}>
                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold transition-colors ${
                          isCurrent ? 'text-violet-400' : isCompleted ? 'text-text-primary' : 'text-text-tertiary'
                        }`}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
                
                {/* Rejected state timeline alert */}
                {company.status === 'rejected' && (
                  <div className="relative flex gap-4">
                    <span className="absolute -left-[20px] top-1 w-5.5 h-5.5 rounded-full flex items-center justify-center z-10 bg-error border-error text-white">
                      <X className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-error">Rejected</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Application ended
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preparation Intelligence (From LeetCode Top 30 Dataset) */}
            {(company.tierCategory || company.industry || (company.preparationTopics && company.preparationTopics.length > 0)) && (
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-violet-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Interview Preparation Intel
                  </h3>
                  {company.difficulty && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      company.difficulty.toLowerCase() === 'hard' 
                        ? 'bg-error/20 text-error border border-error/30' 
                        : 'bg-warning/20 text-warning border border-warning/30'
                    }`}>
                      {company.difficulty} Difficulty
                    </span>
                  )}
                </div>

                {company.tierCategory && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-text-tertiary">Category:</span> {company.tierCategory}
                  </p>
                )}

                {company.preparationTopics && company.preparationTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-text-tertiary font-medium block">Frequently Tested Topics:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {company.preparationTopics.map((topic, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded-md bg-bg-container-low border border-border-default text-[11px] text-text-primary font-mono"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes Section with Auto-Save */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-text-secondary flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Notes & Details
                </h3>
                {isSavingNotes && (
                  <span className="text-[10px] text-violet-400 animate-pulse font-medium">Autosaving...</span>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={8}
                  className="w-full bg-black/20 border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-all resize-none"
                  placeholder="Paste interview questions, interviewer names, dates, or prep checklist here... Notes are autosaved automatically."
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
