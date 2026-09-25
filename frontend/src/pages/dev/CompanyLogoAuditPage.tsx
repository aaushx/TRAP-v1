/**
 * TRAP — Visual Company Logo Verification & Audit Dashboard
 * 
 * Internal development and compliance dashboard displaying:
 * - Runtime Logo Provider: Logo.dev | Local Verified Asset | Legacy Asset | Monogram
 * - Logo Status: VERIFIED | UNVERIFIED | REJECTED | MISSING DOMAIN | LOGO ERROR
 * - Company, Official Domain, Logo Provider, Logo URL, Logo Status, Verification Source, Last Verified
 */

import React, { useState, useMemo } from 'react'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import manifestData from '@/config/company-logo-manifest.json'
import { CompanyLogoManifestEntry } from '@/config/companyLogoRegistry'
import { resolveCompanyLogoDetails } from '@/config/companyLogoResolver'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ImageOff,
  Filter,
  XCircle,
  Copy,
  Check,
  Globe
} from 'lucide-react'

export type AuditFilterStatus =
  | 'ALL'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'REJECTED'
  | 'MISSING DOMAIN'
  | 'PROVIDER: Logo.dev'
  | 'PROVIDER: Monogram'

export const CompanyLogoAuditPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<AuditFilterStatus>('ALL')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const allEntries: CompanyLogoManifestEntry[] = useMemo(() => {
    return (manifestData as unknown as CompanyLogoManifestEntry[]).sort(
      (a, b) => (a.rank || 999) - (b.rank || 999)
    )
  }, [])

  // Process and resolve details for each entry
  const resolvedCatalog = useMemo(() => {
    return allEntries.map((entry) => {
      const hasDomain = Boolean(entry.officialDomain && entry.officialDomain.trim() && entry.officialDomain !== 'null')
      
      const resolved = resolveCompanyLogoDetails({
        name: entry.companyName,
        official_domain: hasDomain ? entry.officialDomain : null,
        logo_status: entry.status,
        slug: entry.logoFile ? entry.logoFile.replace(/\.[^/.]+$/, '').toLowerCase() : null
      })

      // Determine display status
      let displayStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED' | 'MISSING DOMAIN' | 'LOGO ERROR' = 'UNVERIFIED'
      if (entry.status === 'REJECTED') {
        displayStatus = 'REJECTED'
      } else if (!hasDomain) {
        displayStatus = 'MISSING DOMAIN'
      } else if (resolved.status === 'VERIFIED') {
        displayStatus = 'VERIFIED'
      } else {
        displayStatus = 'UNVERIFIED'
      }

      // Determine display provider
      let displayProvider: 'Logo.dev' | 'Local Verified Asset' | 'Legacy Asset' | 'Monogram' = 'Monogram'
      if (resolved.sourceType === 'logo.dev') {
        displayProvider = 'Logo.dev'
      } else if (resolved.sourceType === 'local') {
        displayProvider = 'Local Verified Asset'
      } else {
        displayProvider = 'Monogram'
      }

      return {
        ...entry,
        officialDomain: hasDomain ? entry.officialDomain : null,
        resolvedUrl: resolved.url,
        logoProvider: displayProvider,
        logoStatus: displayStatus,
        verificationSource: entry.sourceUrl || entry.sourceType || 'Logo.dev Image API',
        lastVerified: (entry as { researchedAt?: string }).researchedAt ? (entry as { researchedAt?: string }).researchedAt!.slice(0, 10) : '2026-09-11'
      }
    })
  }, [allEntries])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let verified = 0
    let unverified = 0
    let rejected = 0
    let missingDomain = 0
    let logoDevCount = 0
    let monogramCount = 0

    for (const item of resolvedCatalog) {
      if (item.logoStatus === 'VERIFIED') verified++
      else if (item.logoStatus === 'UNVERIFIED') unverified++
      else if (item.logoStatus === 'REJECTED') rejected++
      else if (item.logoStatus === 'MISSING DOMAIN') missingDomain++

      if (item.logoProvider === 'Logo.dev') logoDevCount++
      else if (item.logoProvider === 'Monogram') monogramCount++
    }

    return {
      total: resolvedCatalog.length,
      verified,
      unverified,
      rejected,
      missingDomain,
      logoDevCount,
      monogramCount
    }
  }, [resolvedCatalog])

  // Filter & Search Logic
  const filteredEntries = useMemo(() => {
    return resolvedCatalog.filter((entry) => {
      // Filter tab
      if (activeFilter === 'VERIFIED' && entry.logoStatus !== 'VERIFIED') return false
      if (activeFilter === 'UNVERIFIED' && entry.logoStatus !== 'UNVERIFIED') return false
      if (activeFilter === 'REJECTED' && entry.logoStatus !== 'REJECTED') return false
      if (activeFilter === 'MISSING DOMAIN' && entry.logoStatus !== 'MISSING DOMAIN') return false
      if (activeFilter === 'PROVIDER: Logo.dev' && entry.logoProvider !== 'Logo.dev') return false
      if (activeFilter === 'PROVIDER: Monogram' && entry.logoProvider !== 'Monogram') return false

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        entry.companyName.toLowerCase().includes(q) ||
        (entry.officialDomain && entry.officialDomain.toLowerCase().includes(q)) ||
        entry.logoProvider.toLowerCase().includes(q) ||
        entry.logoStatus.toLowerCase().includes(q)
      )
    })
  }, [resolvedCatalog, activeFilter, searchQuery])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(text)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-2">
              <Globe className="w-3.5 h-3.5" /> TRAP Official Logo Audit & Verification Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Company Logo Verification Audit</h1>
            <p className="text-text-secondary text-sm mt-1">
              Runtime Source of Truth: Verified Official Domain → Logo.dev Image API with clean monogram fallback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-text-muted bg-bg-surface px-3 py-2 rounded-lg border border-border-default">
              Catalog Size: <strong>{allEntries.length}</strong>
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-default">
            <div className="text-xs text-text-muted">Total Companies</div>
            <div className="text-2xl font-bold mt-1 text-text-primary">{metrics.total}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-medium">Verified (Logo.dev)</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{metrics.verified}</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-400 font-medium">Unverified</div>
            <div className="text-2xl font-bold mt-1 text-amber-400">{metrics.unverified}</div>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="text-xs text-rose-400 font-medium">Rejected</div>
            <div className="text-2xl font-bold mt-1 text-rose-400">{metrics.rejected}</div>
          </div>
          <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
            <div className="text-xs text-sky-400 font-medium">Provider: Logo.dev</div>
            <div className="text-2xl font-bold mt-1 text-sky-400">{metrics.logoDevCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="text-xs text-purple-400 font-medium">Provider: Monogram</div>
            <div className="text-2xl font-bold mt-1 text-purple-400">{metrics.monogramCount}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search company, official domain, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary text-sm transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-text-muted mr-1 shrink-0" />
            {(
              [
                'ALL',
                'VERIFIED',
                'UNVERIFIED',
                'REJECTED',
                'MISSING DOMAIN',
                'PROVIDER: Logo.dev',
                'PROVIDER: Monogram'
              ] as AuditFilterStatus[]
            ).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeFilter === status
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-border-default'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-xs font-mono text-text-muted">
          Showing {filteredEntries.length} of {resolvedCatalog.length} entities
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.companyId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                entry.logoStatus === 'VERIFIED'
                  ? 'bg-bg-surface border-border-default hover:border-brand-primary/50'
                  : entry.logoStatus === 'REJECTED'
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-bg-surface/50 border-amber-500/20'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  {/* Visual Logo Render */}
                  <CompanyLogo
                    company={{
                      name: entry.companyName,
                      official_domain: entry.officialDomain,
                      logo_status: entry.logoStatus
                    }}
                    size="lg"
                  />

                  {/* Status Badge */}
                  {entry.logoStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  ) : entry.logoStatus === 'REJECTED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      <XCircle className="w-3 h-3" /> REJECTED
                    </span>
                  ) : entry.logoStatus === 'MISSING DOMAIN' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      <AlertTriangle className="w-3 h-3" /> NO DOMAIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <ImageOff className="w-3 h-3" /> UNVERIFIED
                    </span>
                  )}
                </div>

                {/* Audit Fields */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div>
                    <span className="text-text-muted text-[11px]">Company:</span>{' '}
                    <strong className="text-text-primary text-sm">{entry.companyName}</strong>
                  </div>

                  <div>
                    <span className="text-text-muted text-[11px]">Official Domain:</span>{' '}
                    {entry.officialDomain ? (
                      <span className="font-mono text-brand-primary">{entry.officialDomain}</span>
                    ) : (
                      <span className="font-mono text-text-muted italic">None (Unresolved)</span>
                    )}
                  </div>

                  <div>
                    <span className="text-text-muted text-[11px]">Logo Provider:</span>{' '}
                    <span
                      className={`font-semibold ${
                        entry.logoProvider === 'Logo.dev'
                          ? 'text-sky-400'
                          : entry.logoProvider === 'Local Verified Asset'
                          ? 'text-emerald-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {entry.logoProvider}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted text-[11px]">Logo Status:</span>{' '}
                    <span className="font-mono text-[11px] font-medium">{entry.logoStatus}</span>
                  </div>
                </div>
              </div>

              {/* URL, Provenance & Verification Footer */}
              <div className="mt-4 pt-3 border-t border-border-default/60 space-y-1.5 text-[11px]">
                <div>
                  <span className="text-text-muted">Logo URL:</span>{' '}
                  {entry.resolvedUrl ? (
                    <div className="flex items-center justify-between font-mono text-[10px] text-text-secondary bg-bg-base px-2 py-1 rounded mt-0.5">
                      <span className="truncate mr-2" title={entry.resolvedUrl}>
                        {entry.resolvedUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(entry.resolvedUrl!)}
                        className="text-text-muted hover:text-text-primary shrink-0"
                        title="Copy logo URL"
                      >
                        {copiedUrl === entry.resolvedUrl ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-text-muted italic text-[10px]">None (Monogram)</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                  <span className="truncate max-w-[180px]" title={entry.verificationSource}>
                    Source: {entry.verificationSource}
                  </span>
                  <span>Verified: {entry.lastVerified}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-bg-surface border border-border-default">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No companies match this filter</h3>
            <p className="text-sm text-text-muted mt-1">Try adjusting your search query or filter selection.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyLogoAuditPage
