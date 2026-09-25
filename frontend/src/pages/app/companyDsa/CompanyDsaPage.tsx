import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, ChevronRight, Award, CheckCircle2 } from 'lucide-react'
import { useCompanyDsaStore } from '@/store/companyDsa.store'
import { CompanyLogo } from '@/components/common/CompanyLogo'

type FilterMode = 'all' | 'most_targeted' | 'most_questions' | 'alphabetical' | 'prepared' | 'not_started'

export const CompanyDsaPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    companies,
    isLoadingCompanies,
    fetchCompanies,
    activeFilter,
    setActiveFilter
  } = useCompanyDsaStore()

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Filter & Search locally for instantaneous response
  const filteredCompanies = useMemo(() => {
    let list = [...companies]

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(q)))
      )
    }

    // 2. Filter Pills
    switch (activeFilter as FilterMode) {
      case 'most_targeted':
        list.sort((a, b) => {
          if (a.is_top_30 && !b.is_top_30) return -1
          if (!a.is_top_30 && b.is_top_30) return 1
          return (a.rank || 999) - (b.rank || 999) || b.question_count - a.question_count
        })
        break
      case 'most_questions':
        list.sort((a, b) => b.question_count - a.question_count)
        break
      case 'alphabetical':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'prepared':
        list = list.filter((c) => c.user_solved_count > 0)
        list.sort((a, b) => b.user_progress_percentage - a.user_progress_percentage)
        break
      case 'not_started':
        list = list.filter((c) => c.user_solved_count === 0)
        list.sort((a, b) => b.question_count - a.question_count)
        break
      case 'all':
      default:
        list.sort((a, b) => {
          if (a.is_top_30 && !b.is_top_30) return -1
          if (!a.is_top_30 && b.is_top_30) return 1
          return (a.rank || 999) - (b.rank || 999) || b.question_count - a.question_count
        })
        break
    }

    return list
  }, [companies, searchQuery, activeFilter])

  const filterOptions: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All Companies' },
    { key: 'most_targeted', label: 'Most Targeted' },
    { key: 'most_questions', label: 'Most Questions' },
    { key: 'alphabetical', label: 'Alphabetical' },
    { key: 'prepared', label: 'Prepared' },
    { key: 'not_started', label: 'Not Started' }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-text-tertiary font-mono">
              Placement Operating System
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mt-1 font-mono">
            Company Wise DSA
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Practice DSA questions asked in technical interviews at top companies.
          </p>
        </div>

        {/* Real Summary Metrics */}
        <div className="flex items-center gap-6 text-sm font-mono bg-bg-surface border border-border-default px-4 py-2.5 rounded-lg shrink-0">
          <div>
            <div className="text-xs text-text-tertiary uppercase">Catalog</div>
            <div className="text-base font-bold text-text-primary">{companies.length} Companies</div>
          </div>
          <div className="w-[1px] h-8 bg-border-default" />
          <div>
            <div className="text-xs text-text-tertiary uppercase">Top Targeted</div>
            <div className="text-base font-bold text-brand-primary">Top 30 Seeded</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search companies (e.g. Amazon, Google, D. E. Shaw)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-text-primary"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === opt.key
                  ? 'bg-primary text-text-inverse font-bold shadow-sm'
                  : 'bg-bg-surface text-text-secondary border border-border-default hover:text-text-primary hover:border-border-strong'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Companies Grid ─────────────────────────────────────── */}
      {isLoadingCompanies ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-xl border border-border-default bg-bg-surface animate-pulse p-5"
            />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border-default rounded-xl bg-bg-surface/50">
          <Building2 className="w-12 h-12 text-text-tertiary mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">No companies matched your search</h3>
          <p className="text-xs text-text-secondary mt-1">Try adjusting your keyword or reset filters.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveFilter('all')
            }}
            className="mt-4 px-4 py-1.5 text-xs font-mono bg-bg-surface border border-border-default hover:border-text-primary rounded-md text-text-primary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompanies.map((company) => {
            const isStarted = company.user_solved_count > 0

            return (
              <div
                key={company.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/app/company-dsa/${company.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/app/company-dsa/${company.slug}`)
                  }
                }}
                className="group relative flex flex-col justify-between p-5 rounded-xl border border-border-default bg-bg-surface hover:border-text-secondary/50 hover:shadow-md transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Official Company Logo Avatar */}
                    <CompanyLogo
                      company={company}
                      size="md"
                      containerClassName="group-hover:border-brand-primary transition-colors"
                    />

                    {/* Top 30 Badge */}
                    {company.is_top_30 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                        <Award className="w-3 h-3" />
                        #{company.rank || 'Top'}
                      </span>
                    )}
                  </div>

                  {/* Company Name & Questions count */}
                  <h3 className="text-base font-bold text-text-primary group-hover:text-brand-primary transition-colors truncate">
                    {company.name}
                  </h3>
                  <p className="text-xs font-mono text-text-tertiary mt-0.5">
                    {company.question_count.toLocaleString()} Questions
                  </p>
                </div>

                {/* Card Bottom Progress */}
                <div className="mt-5 pt-3 border-t border-border-subtle">
                  {isStarted ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-text-secondary flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {company.user_solved_count} / {company.question_count}
                        </span>
                        <span className="font-bold text-text-primary">
                          {company.user_progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, company.user_progress_percentage)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                      <span>Not Started</span>
                      <span className="flex items-center gap-0.5 text-text-secondary group-hover:translate-x-1 transition-transform">
                        Prepare <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default CompanyDsaPage
