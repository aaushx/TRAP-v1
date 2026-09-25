/**
 * TRAP — Company Logo Engine & Public Export Module
 * 
 * Central export for company logo resolution following the strict priority hierarchy:
 * 1. VERIFIED official company domain → Logo.dev Image API
 * 2. VERIFIED local asset explicitly reviewed and approved
 * 3. Clean monogram fallback (returns null)
 */

import {
  resolveCompanyLogo,
  resolveCompanyLogoDetails,
  normalizeCompanyLookupKey,
  VERIFIED_REFERENCE_DOMAINS,
  APPROVED_LOCAL_LOGOS,
  CompanyLogoInput,
  ResolvedLogoDetails
} from './companyLogoResolver'
import { buildLogoDevUrl } from './logoDev'

export {
  resolveCompanyLogo,
  resolveCompanyLogoDetails,
  normalizeCompanyLookupKey,
  buildLogoDevUrl,
  VERIFIED_REFERENCE_DOMAINS,
  APPROVED_LOCAL_LOGOS
}
export type { CompanyLogoInput, ResolvedLogoDetails }

/**
 * Backwards compatibility wrapper mapping getCompanyLogoUrl to resolveCompanyLogo.
 */
export function getCompanyLogoUrl(
  company: string | CompanyLogoInput | null | undefined
): string | null {
  return resolveCompanyLogo(company)
}

/**
 * Normalizes company input keys without fuzzy substring matching.
 */
export function normalizeCompanyKey(raw: string | undefined | null): string {
  if (!raw) return ''
  return raw.toLowerCase().trim().replace(/[^a-z0-9.]/g, '')
}
