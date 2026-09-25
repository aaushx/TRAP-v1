/**
 * TRAP — Development Logo & Raw Logo.dev Diagnostics Page (/dev/logo-test)
 * 
 * Verifies end-to-end Logo.dev rendering across both CompanyLogo component
 * and raw <img> tags, isolating plumbing vs network/credential failures.
 * 
 * SECURITY:
 * Never displays raw tokens in plain text; displays masked tokens (e.g. pk_***).
 */

import React, { useState } from 'react'
import { CompanyLogo } from '@/components/common/CompanyLogo'
import { buildLogoDevUrl } from '@/config/logoDev'
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'

interface TestCompany {
  name: string
  domain: string
}

const TEST_COMPANIES: TestCompany[] = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Meta', domain: 'meta.com' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Capgemini', domain: 'capgemini.com' },
  { name: 'TCS', domain: 'tcs.com' },
  { name: 'Infosys', domain: 'infosys.com' },
  { name: 'Wipro', domain: 'wipro.com' },
  { name: 'Meesho', domain: 'meesho.com' },
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'Uber', domain: 'uber.com' },
  { name: 'TikTok', domain: 'tiktok.com' },
  { name: 'Oracle', domain: 'oracle.com' },
]

export const LogoTestPage: React.FC = () => {
  const publishableKey = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY || ''
  const isKeyConfigured = Boolean(publishableKey && publishableKey.trim())
  const maskedKey = isKeyConfigured
    ? `${publishableKey.slice(0, 6)}...${publishableKey.slice(-4)}`
    : 'NOT CONFIGURED'
  const keyLength = publishableKey.length

  const [rawStatus, setRawStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({})

  const handleImageLoad = (domain: string) => {
    setRawStatus((prev) => ({ ...prev, [domain]: 'success' }))
  }

  const handleImageError = (domain: string) => {
    setRawStatus((prev) => ({ ...prev, [domain]: 'error' }))
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Environment Diagnostics */}
        <div className="border-b border-border-default pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Development Logo Verification Diagnostic (/dev/logo-test)
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Logo.dev Direct Rendering Test</h1>
          <p className="text-text-secondary text-sm mt-1">
            Isolates Logo.dev Image API CDN responses from CompanyLogo component plumbing.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-bg-surface border border-border-default">
              <div className="text-xs text-text-muted">Publishable Key Configured</div>
              <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
                {isKeyConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> YES
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> NO
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-surface border border-border-default">
              <div className="text-xs text-text-muted">Key Prefix (Masked)</div>
              <div className="text-sm font-mono mt-1 text-accent-blue">{maskedKey}</div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-surface border border-border-default">
              <div className="text-xs text-text-muted">Key Length</div>
              <div className="text-sm font-mono mt-1">{keyLength} characters</div>
            </div>
          </div>
        </div>

        {/* Diagnostic Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEST_COMPANIES.map((company) => {
            const rawUrl = buildLogoDevUrl(company.domain)
            const maskedUrl = rawUrl
              ? rawUrl.replace(/token=([^&]+)/, 'token=pk_***')
              : 'NULL (Unconfigured)'

            const status = rawStatus[company.domain] || 'loading'

            return (
              <div
                key={company.domain}
                className="p-4 rounded-xl bg-bg-surface border border-border-default flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* 1. Component Rendering */}
                  <CompanyLogo
                    company={{ name: company.name, official_domain: company.domain, logo_status: 'VERIFIED' }}
                    size="lg"
                  />

                  {/* 2. Raw <img> Tag Rendering for Direct Isolation */}
                  <div className="w-14 h-14 rounded-xl bg-bg-base border border-border-default flex items-center justify-center p-2 shrink-0">
                    {rawUrl ? (
                      <img
                        src={rawUrl}
                        alt={company.name}
                        onLoad={() => handleImageLoad(company.domain)}
                        onError={() => handleImageError(company.domain)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-text-muted font-mono">No URL</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="font-bold text-sm text-text-primary truncate">{company.name}</div>
                    <div className="text-xs font-mono text-text-secondary">{company.domain}</div>
                    <div className="text-[10px] font-mono text-text-muted truncate" title={maskedUrl}>
                      {maskedUrl}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 text-right">
                  {status === 'success' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> HTTP 200
                    </span>
                  ) : status === 'error' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" /> FAILED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Loading...
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LogoTestPage
