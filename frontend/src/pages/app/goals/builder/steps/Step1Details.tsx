import { useState } from 'react'
import { useBuilderContext } from '../GoalBuilder'
import { ArrowRight, Target, Clock, Calendar, Search, ChevronDown, Sparkles } from 'lucide-react'
import { CompanyLogo } from '@/components/common/CompanyLogo'

interface Step1Props {
  roles: string[]
  companies: string[]
}

/**
 * Step 1: Basic Information Form Component
 *
 * Implements a spacious, responsive two-column layout on desktop:
 * - Left column: The main goal configuration form inside an elevated surface card.
 * - Right column: A sticky Live Summary card giving instant visual feedback as the user types.
 */
export function Step1Details({ roles, companies }: Step1Props) {
  const { state, setState, nextStep } = useBuilderContext()
  const [companySearch, setCompanySearch] = useState('')

  // Validation: Both title and target role are mandatory to proceed
  const isValid = state.title.trim() !== '' && state.targetRole !== ''

  /**
   * Toggles a company in the target companies selection array.
   * If already selected, removes it; otherwise appends it.
   */
  const toggleCompany = (company: string) => {
    setState(prev => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(company)
        ? prev.targetCompanies.filter(c => c !== company)
        : [...prev.targetCompanies, company]
    }))
  }

  // Filter companies by the search query
  const filteredCompanies = companies.filter(c => 
    c.toLowerCase().includes(companySearch.toLowerCase())
  )

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* ── LEFT: Main Goal Builder Form Card ────────────────────────────── */}
      <div className="flex-1 w-full bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm space-y-8 relative group">
        {/* Top Stripe Accent (Nothing-inspired digitalism) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />

        {/* Section Heading */}
        <div className="border-b border-border-default border-dashed pb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
              Basic Information
            </h2>
          </div>
          <p className="text-text-secondary text-xs font-mono mt-1">
            Define the core parameters, target role, and timeline of your preparation goal.
          </p>
        </div>

        {/* Form Inputs Container */}
        <div className="space-y-6">
          {/* Goal Title */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-text-secondary tracking-wider">
              Goal Title <span className="text-secondary">*</span>
            </label>
            <input 
              type="text" 
              value={state.title}
              onChange={e => setState(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. FAANG Software Engineer Preparation 2026"
              className="w-full bg-bg-base border border-border-default rounded-md px-4 py-3.5 text-sm font-medium text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
            <p className="text-[11px] font-mono text-text-tertiary">
              Give your goal a motivating, descriptive name.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-text-secondary tracking-wider">
              Description <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <textarea 
              value={state.description}
              onChange={e => setState(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your strategy, target compensation, specific team preferences, or study notes..."
              className="w-full bg-bg-base border border-border-default rounded-md px-4 py-3 text-sm text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors resize-none h-24"
            />
          </div>

          {/* Two-column Form Row: Target Role & Target Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Target Role Field */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-text-secondary tracking-wider">
                Target Role <span className="text-secondary">*</span>
              </label>
              <div className="relative">
                <select
                  value={state.targetRole}
                  onChange={e => setState(p => ({ ...p, targetRole: e.target.value }))}
                  className="w-full bg-bg-base border border-border-default rounded-md px-4 py-3 text-sm text-primary appearance-none pr-10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled className="bg-bg-surface text-text-tertiary">
                    Select a target role...
                  </option>
                  {roles.map((role) => (
                    <option key={role} value={role} className="bg-bg-surface text-primary">
                      {role}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Quick Role Badges for Rapid Selection */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roles.map((role) => {
                  const isSelected = state.targetRole === role
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setState(p => ({ ...p, targetRole: role }))}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-text-inverse font-bold shadow-sm'
                          : 'bg-bg-container-low text-text-secondary hover:text-primary hover:bg-bg-container-high border border-border-default'
                      }`}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target Deadline Field */}
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-text-secondary tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                Target Deadline <span className="text-text-tertiary font-normal">(Optional)</span>
              </label>
              <input 
                type="date" 
                value={state.deadline}
                onChange={e => setState(p => ({ ...p, deadline: e.target.value }))}
                className="w-full bg-bg-base border border-border-default rounded-md px-4 py-3 text-sm text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors cursor-pointer"
              />
              <p className="text-[11px] font-mono text-text-tertiary">
                Used to calculate daily study targets and preparation velocity countdowns.
              </p>
            </div>
          </div>

          {/* Daily Study Commitment Field */}
          <div className="p-4 rounded-lg bg-bg-container-low/40 border border-border-default space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase text-text-secondary tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-secondary" /> Daily Study Commitment
              </label>
              <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded bg-bg-surface border border-border-default">
                {state.dailyStudyHours} hours / day
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" max="12" step="0.5"
                value={state.dailyStudyHours}
                onChange={e => setState(p => ({ ...p, dailyStudyHours: parseFloat(e.target.value) }))}
                className="w-full accent-primary h-2 bg-bg-container-high rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
              <span>1 hour (Paced)</span>
              <span>4-6 hours (Intensive)</span>
              <span>12 hours (Full-time)</span>
            </div>
          </div>

          {/* Target Companies Selection */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-text-secondary tracking-wider">
                  Target Companies{' '}
                  <span className="text-text-tertiary font-normal lowercase">
                    ({state.targetCompanies.length} selected for company prep)
                  </span>
                </label>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Select key companies to tailor your question pool and topic weighting.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="Search top companies..."
                  className="w-full bg-bg-base border border-border-default rounded-md pl-9 pr-3 py-2 text-xs text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Selected Company Badges */}
            {state.targetCompanies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-bg-container-low/60 border border-border-default">
                <span className="text-[10px] font-mono uppercase font-bold text-text-tertiary mr-1">
                  Active Targets:
                </span>
                {state.targetCompanies.map((company) => (
                  <span
                    key={company}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary text-text-inverse shadow-sm"
                  >
                    <CompanyLogo company={company} size="xs" showContainer={false} className="w-3.5 h-3.5" />
                    {company}
                    <button
                      type="button"
                      onClick={() => toggleCompany(company)}
                      className="hover:opacity-75 text-text-inverse font-bold transition-opacity focus:outline-none ml-1 text-sm leading-none cursor-pointer"
                      aria-label={`Remove ${company}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Available Company Chips */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto custom-scrollbar p-2 border border-border-default/60 rounded-lg bg-bg-base/50">
              {filteredCompanies.map((company) => {
                const isSelected = state.targetCompanies.includes(company)
                return (
                  <button
                    type="button"
                    key={company}
                    onClick={() => toggleCompany(company)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary text-text-inverse font-bold shadow-sm' 
                        : 'border-border-default bg-bg-surface text-text-secondary hover:text-primary hover:border-text-primary'
                    }`}
                  >
                    <CompanyLogo company={company} size="xs" showContainer={false} className="w-3.5 h-3.5" />
                    {company}
                  </button>
                )
              })}
              {filteredCompanies.length === 0 && (
                <span className="text-xs text-text-tertiary font-mono italic p-3">
                  No companies found matching "{companySearch}"
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Form Action Bar */}
        <div className="pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono text-text-tertiary">
            {!isValid ? '* Please enter a title and select a target role to proceed' : 'Ready to configure categories'}
          </span>
          <button
            type="button"
            onClick={nextStep}
            disabled={!isValid}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-text-inverse hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
          >
            Continue to Categories
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── RIGHT: Live Summary Card ─────────────────────────────────────── */}
      <div className="w-full lg:w-80 xl:w-[350px] shrink-0 sticky top-6">
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-7 shadow-sm space-y-6 relative group">
          {/* Top Stripe Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default border-dashed pb-4">
            <h3 className="font-bold font-display text-sm uppercase text-primary flex items-center gap-2 tracking-wide">
              <Target className="w-4 h-4 text-primary" />
              Live Summary
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-container-low border border-border-default text-text-secondary uppercase">
              Step 1 of 5
            </span>
          </div>

          {/* Summary Metrics List */}
          <div className="space-y-4 text-xs font-mono">
            {/* Title */}
            <div className="p-3 bg-bg-container-low/40 rounded border border-border-default/60">
              <span className="text-[10px] uppercase text-text-tertiary block mb-1">Goal Title</span>
              <span className="text-primary font-bold block text-sm font-sans truncate">
                {state.title.trim() || <span className="text-text-tertiary font-mono italic">Untitled Goal</span>}
              </span>
            </div>

            {/* Target Role */}
            <div className="p-3 bg-bg-container-low/40 rounded border border-border-default/60">
              <span className="text-[10px] uppercase text-text-tertiary block mb-1">Target Role</span>
              <span className="text-primary font-semibold block">
                {state.targetRole || <span className="text-text-tertiary italic">Not selected</span>}
              </span>
            </div>

            {/* Target Deadline */}
            <div className="p-3 bg-bg-container-low/40 rounded border border-border-default/60">
              <span className="text-[10px] uppercase text-text-tertiary block mb-1">Deadline</span>
              <span className="text-primary font-semibold block">
                {state.deadline 
                  ? new Date(state.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : <span className="text-text-tertiary italic">Flexible</span>}
              </span>
            </div>

            {/* Selected Companies */}
            <div className="p-3 bg-bg-container-low/40 rounded border border-border-default/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase text-text-tertiary block">Target Companies</span>
                <span className="text-[10px] font-bold text-primary">
                  {state.targetCompanies.length}
                </span>
              </div>
              {state.targetCompanies.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {state.targetCompanies.map(c => (
                    <span key={c} className="px-2 py-0.5 rounded bg-bg-surface border border-border-default text-[10px] text-text-secondary">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-text-tertiary italic text-[11px]">No specific companies targeted</span>
              )}
            </div>

            {/* Study Commitment */}
            <div className="p-3 bg-bg-container-low/40 rounded border border-border-default/60">
              <span className="text-[10px] uppercase text-text-tertiary block mb-1">Study Pace</span>
              <span className="text-primary font-semibold block">
                {state.dailyStudyHours} hours / day
              </span>
            </div>
          </div>

          {/* Primary CTA in Summary */}
          <div className="pt-2">
            <button
              type="button"
              onClick={nextStep}
              disabled={!isValid}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-text-inverse hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] font-mono text-text-tertiary">
              <Sparkles className="w-3 h-3 text-secondary" />
              <span>Next: Select your focus categories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
