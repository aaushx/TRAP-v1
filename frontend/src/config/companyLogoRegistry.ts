/**
 * TRAP — Comprehensive Company Identity Normalization & Logo Registry Engine
 * 
 * Consumes the verified research manifest (company-logo-manifest.json) as the single source
 * of truth. Maps database company records deterministically to verified local assets.
 */

import manifestData from './company-logo-manifest.json'

export interface CompanyLogoManifestEntry {
  /** Database UUID primary key */
  companyId: string
  /** Database raw name */
  companyName: string
  /** Human-readable canonical display name */
  canonicalName: string
  /** Official web domain */
  officialDomain: string
  /** Deterministic filename (e.g. google.svg) */
  logoFile: string
  /** Relative local path to asset (e.g. /assets/company-logos/google.svg) */
  localPath: string | null
  /** Source category */
  sourceType: string
  /** Source URL or provenance link */
  sourceUrl: string
  /** Repository name if applicable (e.g. Simple Icons) */
  repository: string | null
  /** Repository slug if applicable */
  repositorySlug: string | null
  /** Boolean verification flag */
  verified: boolean
  /** Exact verification status */
  status: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED'
  /** Method of verification */
  verificationMethod: string
  /** Asset quality */
  quality: string
  /** Confidence tier */
  confidence: string
  /** SHA-256 asset checksum */
  sha256: string
  /** Question count in catalog */
  questionCount?: number
  /** Catalog rank */
  rank?: number
  /** Research notes / audit details */
  notes?: string
}

// Backward compatibility type alias
export interface CanonicalCompanyIdentity extends CompanyLogoManifestEntry {
  id: string
  databaseName: string
  displayName: string
  slug: string
  logoSlug: string
  logoSource: string
  logoVerified: boolean
  domain: string
  assetPath: string
  aliases: string[]
}

const rawManifest = manifestData as unknown as CompanyLogoManifestEntry[]

// Index maps
export const COMPANY_IDENTITY_REGISTRY: Record<string, CanonicalCompanyIdentity> = {}
export const COMPANY_ID_MAP: Record<string, string> = {}

// Build index maps
for (const entry of rawManifest) {
  const slug = entry.logoFile.replace(/\.[^/.]+$/, '').toLowerCase().trim()
  const identity: CanonicalCompanyIdentity = {
    ...entry,
    id: entry.companyId,
    databaseName: entry.companyName,
    displayName: entry.canonicalName || entry.companyName,
    slug,
    logoSlug: slug,
    logoSource: entry.sourceType,
    logoVerified: entry.status === 'VERIFIED',
    domain: entry.officialDomain,
    assetPath: entry.localPath || `/assets/company-logos/${entry.logoFile}`,
    aliases: [slug, entry.companyName.toLowerCase().trim()]
  }

  COMPANY_IDENTITY_REGISTRY[slug] = identity
  COMPANY_ID_MAP[entry.companyId] = slug
}

/** Strict Canonical Name Normalizer */
export function normalizeCanonicalName(raw: string | undefined | null): string {
  if (!raw) return ''
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Resolves full company identity structure from ID, object, or string name/slug.
 * Strict exact matching only; zero fuzzy substring matching.
 */
export function getCompanyIdentity(
  companyInput: string | { id?: string; name?: string; slug?: string; companyId?: string } | undefined | null
): CanonicalCompanyIdentity | null {
  if (!companyInput) return null

  // 1. Resolve by Object
  if (typeof companyInput === 'object') {
    const id = companyInput.id || companyInput.companyId
    if (id && COMPANY_ID_MAP[id]) {
      const targetSlug = COMPANY_ID_MAP[id]
      return COMPANY_IDENTITY_REGISTRY[targetSlug] || null
    }
    if (companyInput.slug) {
      const s = companyInput.slug.toLowerCase().trim()
      if (COMPANY_IDENTITY_REGISTRY[s]) return COMPANY_IDENTITY_REGISTRY[s]
    }
    if (companyInput.name) {
      const norm = normalizeCanonicalName(companyInput.name)
      for (const key in COMPANY_IDENTITY_REGISTRY) {
        const item = COMPANY_IDENTITY_REGISTRY[key]
        if (normalizeCanonicalName(item.databaseName) === norm || normalizeCanonicalName(item.displayName) === norm) {
          return item
        }
      }
    }
  }

  // 2. Resolve by String (ID, Slug, or Exact Name)
  if (typeof companyInput === 'string') {
    const str = companyInput.trim()
    if (COMPANY_ID_MAP[str] && COMPANY_IDENTITY_REGISTRY[COMPANY_ID_MAP[str]]) {
      return COMPANY_IDENTITY_REGISTRY[COMPANY_ID_MAP[str]]
    }
    const lower = str.toLowerCase()
    if (COMPANY_IDENTITY_REGISTRY[lower]) {
      return COMPANY_IDENTITY_REGISTRY[lower]
    }
    const norm = normalizeCanonicalName(str)
    for (const key in COMPANY_IDENTITY_REGISTRY) {
      const item = COMPANY_IDENTITY_REGISTRY[key]
      if (normalizeCanonicalName(item.databaseName) === norm || normalizeCanonicalName(item.displayName) === norm) {
        return item
      }
    }
  }

  return null
}

/**
 * Resolves local verified logo URL for a company or returns null if unverified/rejected.
 */
export function getCompanyLogoUrl(
  companyInput: string | { id?: string; name?: string; slug?: string } | undefined | null
): string | null {
  const identity = getCompanyIdentity(companyInput)
  if (identity && identity.status === 'VERIFIED' && identity.localPath) {
    return identity.localPath
  }
  return null
}
