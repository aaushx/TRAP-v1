/**
 * TRAP — Central Company Logo Resolver
 * 
 * Implements the strict Logo Priority Hierarchy:
 * 1. VERIFIED official company domain → Logo.dev Image API
 * 2. VERIFIED local asset explicitly reviewed and approved
 * 3. Clean monogram fallback (returns null)
 * 
 * RULES ENFORCED:
 * - The database's official_domain is the identity anchor.
 * - Existing unverified SVGs are legacy and NEVER automatically trusted.
 * - Zero name.includes(), zero substring matching, zero fuzzy logo mapping.
 */

import { buildLogoDevUrl, LogoDevImageOptions } from './logoDev'

export interface CompanyLogoInput {
  id?: string | null
  name?: string | null
  official_domain?: string | null
  officialDomain?: string | null
  logo_status?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED' | string | null
  logoStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED' | string | null
  logo_provider?: string | null
  logoProvider?: string | null
  slug?: string | null
}

/**
 * Registry of explicitly reviewed and approved local assets only.
 * Unverified legacy SVGs are NEVER placed here.
 */
export const APPROVED_LOCAL_LOGOS: Record<string, string> = {
  // Empty until local assets are individually reviewed, verified, and signed off.
}

/**
 * Strict exact canonical dictionary of verified official domains for key benchmark companies.
 * Zero fuzzy or substring matching is permitted.
 */
export const VERIFIED_REFERENCE_DOMAINS: Record<string, string> = {
  google: 'google.com',
  amazon: 'amazon.com',
  microsoft: 'microsoft.com',
  meta: 'meta.com',
  apple: 'apple.com',
  capgemini: 'capgemini.com',
  tcs: 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  meesho: 'meesho.com',
  phonepe: 'phonepe.com',
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  razorpay: 'razorpay.com',
  kpit: 'kpit.com',
  coforge: 'coforge.com',
  hashedin: 'hashedin.com',
  turing: 'turing.com',
  'media.net': 'media.net',
  medianet: 'media.net',
  // Top 30 additional verified companies
  bloomberg: 'bloomberg.com',
  uber: 'uber.com',
  tiktok: 'tiktok.com',
  oracle: 'oracle.com',
  goldmansachs: 'goldmansachs.com',
  'goldman-sachs': 'goldmansachs.com',
  salesforce: 'salesforce.com',
  ibm: 'ibm.com',
  linkedin: 'linkedin.com',
  zoho: 'zoho.com',
  'walmart-labs': 'walmart.com',
  walmart: 'walmart.com',
  adobe: 'adobe.com',
  visa: 'visa.com',
  accenture: 'accenture.com',
  nvidia: 'nvidia.com',
  yandex: 'yandex.com',
  'd-e-shaw': 'deshaw.com',
  'd. e. shaw': 'deshaw.com',
  deshaw: 'deshaw.com',
  flipkart: 'flipkart.com',
  paypal: 'paypal.com',
  snowflake: 'snowflake.com',
  citadel: 'citadel.com',
  cisco: 'cisco.com',
  doordash: 'doordash.com',
}

/**
 * Strict canonical key normalization: converts to lower case and strips non-alphanumeric/dot chars.
 * Does NOT perform fuzzy substring search.
 */
export function normalizeCompanyLookupKey(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export type LogoSourceType = 'logo.dev' | 'local' | 'monogram'
export type LogoResolutionStatus = 'VERIFIED' | 'UNVERIFIED' | 'REJECTED' | 'MISSING_DOMAIN'

export interface ResolvedLogoDetails {
  sourceType: LogoSourceType
  url: string | null
  domain: string | null
  status: LogoResolutionStatus
  provider: string
}

/**
 * Extracts or resolves the official domain for a company input.
 * Strict exact matching only.
 */
export function extractOfficialDomain(
  company: string | CompanyLogoInput | null | undefined
): { domain: string | null; isExplicit: boolean } {
  if (!company) return { domain: null, isExplicit: false }

  if (typeof company === 'string') {
    const trimmed = company.trim().toLowerCase()
    // 1. Direct domain check (e.g. 'google.com', 'capgemini.com')
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return { domain: trimmed, isExplicit: true }
    }
    // 2. Strict exact match against reference catalog
    const norm = normalizeCompanyLookupKey(trimmed)
    if (VERIFIED_REFERENCE_DOMAINS[norm]) {
      return { domain: VERIFIED_REFERENCE_DOMAINS[norm], isExplicit: true }
    }
    if (VERIFIED_REFERENCE_DOMAINS[trimmed]) {
      return { domain: VERIFIED_REFERENCE_DOMAINS[trimmed], isExplicit: true }
    }
    return { domain: null, isExplicit: false }
  }

  // Object structure from database or custom company prop
  const explicitDomain = company.official_domain || company.officialDomain || (company as { domain?: string }).domain
  if (explicitDomain && explicitDomain.trim()) {
    return { domain: explicitDomain.trim().toLowerCase(), isExplicit: true }
  }

  // Fallback check against strict verified dictionary for database records without explicit domain
  if (company.slug) {
    const slugKey = company.slug.trim().toLowerCase()
    if (VERIFIED_REFERENCE_DOMAINS[slugKey]) {
      return { domain: VERIFIED_REFERENCE_DOMAINS[slugKey], isExplicit: false }
    }
  }

  if (company.name) {
    const nameNorm = normalizeCompanyLookupKey(company.name)
    if (VERIFIED_REFERENCE_DOMAINS[nameNorm]) {
      return { domain: VERIFIED_REFERENCE_DOMAINS[nameNorm], isExplicit: false }
    }
  }

  return { domain: null, isExplicit: false }
}

/**
 * Comprehensive logo resolution providing provider, status, and URL details.
 */
export function resolveCompanyLogoDetails(
  company: string | CompanyLogoInput | null | undefined,
  options?: LogoDevImageOptions
): ResolvedLogoDetails {
  if (!company) {
    return {
      sourceType: 'monogram',
      url: null,
      domain: null,
      status: 'MISSING_DOMAIN',
      provider: 'monogram'
    }
  }

  const { domain } = extractOfficialDomain(company)
  const explicitStatus = typeof company === 'object'
    ? (company.logo_status || company.logoStatus)
    : null

  // If company was rejected, do not resolve a logo
  if (explicitStatus === 'REJECTED') {
    return {
      sourceType: 'monogram',
      url: null,
      domain,
      status: 'REJECTED',
      provider: 'monogram'
    }
  }

  // 1. VERIFIED official company domain → Logo.dev Image API
  const isVerifiedDomain = Boolean(domain && (explicitStatus === 'VERIFIED' || !explicitStatus))
  if (isVerifiedDomain && domain) {
    const logoDevUrl = buildLogoDevUrl(domain, options)
    if (logoDevUrl) {
      return {
        sourceType: 'logo.dev',
        url: logoDevUrl,
        domain,
        status: 'VERIFIED',
        provider: 'Logo.dev'
      }
    }
  }

  // 2. VERIFIED local asset explicitly reviewed and approved
  const slug = typeof company === 'object' ? company.slug : normalizeCompanyLookupKey(company)
  if (slug && APPROVED_LOCAL_LOGOS[slug]) {
    return {
      sourceType: 'local',
      url: APPROVED_LOCAL_LOGOS[slug],
      domain,
      status: 'VERIFIED',
      provider: 'Local Verified Asset'
    }
  }

  // 3. Monogram Fallback
  return {
    sourceType: 'monogram',
    url: null,
    domain,
    status: domain ? 'UNVERIFIED' : 'MISSING_DOMAIN',
    provider: 'Monogram'
  }
}

/**
 * Main Central Resolver:
 * resolveCompanyLogo(company, options?)
 * 
 * Returns Logo.dev URL, approved local asset path, or null (monogram).
 */
export function resolveCompanyLogo(
  company: string | CompanyLogoInput | null | undefined,
  options?: LogoDevImageOptions
): string | null {
  const details = resolveCompanyLogoDetails(company, options)
  return details.url
}
