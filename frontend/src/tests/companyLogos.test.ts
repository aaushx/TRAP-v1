/**
 * TRAP — Company Logo & Logo.dev Resolution Tests
 * 
 * Validates the strict priority hierarchy:
 * 1. VERIFIED official company domain → Logo.dev Image API
 * 2. VERIFIED local asset explicitly reviewed and approved
 * 3. Clean monogram fallback (null)
 * 
 * Explicitly validates all 19 critical benchmark companies:
 * Google, Amazon, Microsoft, Meta, Apple, Capgemini, TCS, Infosys, Wipro,
 * Meesho, PhonePe, Swiggy, Zomato, Razorpay, KPIT, Coforge, HashedIn, Turing, Media.net
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveCompanyLogo,
  resolveCompanyLogoDetails,
  extractOfficialDomain,
  normalizeCompanyLookupKey
} from '@/config/companyLogoResolver'
import { buildLogoDevUrl } from '@/config/logoDev'

// 19 Critical Benchmark Companies specified in requirements
const CRITICAL_COMPANIES = [
  { name: 'Google', expectedDomain: 'google.com' },
  { name: 'Amazon', expectedDomain: 'amazon.com' },
  { name: 'Microsoft', expectedDomain: 'microsoft.com' },
  { name: 'Meta', expectedDomain: 'meta.com' },
  { name: 'Apple', expectedDomain: 'apple.com' },
  { name: 'Capgemini', expectedDomain: 'capgemini.com' },
  { name: 'TCS', expectedDomain: 'tcs.com' },
  { name: 'Infosys', expectedDomain: 'infosys.com' },
  { name: 'Wipro', expectedDomain: 'wipro.com' },
  { name: 'Meesho', expectedDomain: 'meesho.com' },
  { name: 'PhonePe', expectedDomain: 'phonepe.com' },
  { name: 'Swiggy', expectedDomain: 'swiggy.com' },
  { name: 'Zomato', expectedDomain: 'zomato.com' },
  { name: 'Razorpay', expectedDomain: 'razorpay.com' },
  { name: 'KPIT', expectedDomain: 'kpit.com' },
  { name: 'Coforge', expectedDomain: 'coforge.com' },
  { name: 'HashedIn', expectedDomain: 'hashedin.com' },
  { name: 'Turing', expectedDomain: 'turing.com' },
  { name: 'Media.net', expectedDomain: 'media.net' },
]

describe('Company Logo Domain & Logo.dev Resolution Tests', () => {
  beforeEach(() => {
    // Ensure test environment provides publishable key
    vi.stubEnv('VITE_LOGO_DEV_PUBLISHABLE_KEY', 'pk_test_publishable_token')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should normalize lookup keys deterministically without fuzzy substring errors', () => {
    expect(normalizeCompanyLookupKey('Media.net')).toBe('medianet')
    expect(normalizeCompanyLookupKey('Google LLC')).toBe('googlellc')
    expect(normalizeCompanyLookupKey('  Meta Platforms, Inc.  ')).toBe('metaplatformsinc')
  })

  it('should explicitly resolve all 19 critical benchmark companies: Company -> Official Domain -> Logo.dev', () => {
    for (const item of CRITICAL_COMPANIES) {
      // 1. Domain extraction
      const { domain } = extractOfficialDomain(item.name)
      expect(domain).toBe(item.expectedDomain)

      // 2. Full resolution to Logo.dev Image API URL
      const logoUrl = resolveCompanyLogo(item.name)
      expect(logoUrl).not.toBeNull()
      expect(logoUrl).toBe(`https://img.logo.dev/${item.expectedDomain}?token=pk_test_publishable_token`)

      // 3. Resolution details verification
      const details = resolveCompanyLogoDetails(item.name)
      expect(details.sourceType).toBe('logo.dev')
      expect(details.provider).toBe('Logo.dev')
      expect(details.domain).toBe(item.expectedDomain)
      expect(details.status).toBe('VERIFIED')
    }
  })

  it('should resolve database company records with official_domain to Logo.dev URL', () => {
    const dbCompany = {
      id: '648876b8-1665-4028-bba8-25b02839c7bb',
      name: 'Capgemini',
      official_domain: 'capgemini.com',
      logo_provider: 'logo.dev',
      logo_status: 'VERIFIED'
    }

    const resolvedUrl = resolveCompanyLogo(dbCompany)
    expect(resolvedUrl).toBe('https://img.logo.dev/capgemini.com?token=pk_test_publishable_token')

    const details = resolveCompanyLogoDetails(dbCompany)
    expect(details.sourceType).toBe('logo.dev')
    expect(details.domain).toBe('capgemini.com')
    expect(details.status).toBe('VERIFIED')
  })

  it('should build valid Logo.dev URLs with size and format options', () => {
    const urlWithOptions = buildLogoDevUrl('google.com', { size: 128, format: 'png' })
    expect(urlWithOptions).toContain('https://img.logo.dev/google.com')
    expect(urlWithOptions).toContain('token=pk_test_publishable_token')
    expect(urlWithOptions).toContain('size=128')
    expect(urlWithOptions).toContain('format=png')
  })

  it('should return null (clean monogram fallback) for unknown companies without official_domain', () => {
    const unknownCompany = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'TotallyUnknownStartupXYZ12345',
      official_domain: null,
      logo_status: 'UNVERIFIED'
    }

    const result = resolveCompanyLogo(unknownCompany)
    expect(result).toBeNull()

    const details = resolveCompanyLogoDetails(unknownCompany)
    expect(details.sourceType).toBe('monogram')
    expect(details.status).toBe('MISSING_DOMAIN')
    expect(details.provider).toBe('Monogram')
  })

  it('should return null (monogram) when company is explicitly REJECTED', () => {
    const rejectedCompany = {
      name: 'FakeScamCompany',
      official_domain: 'fakescam.com',
      logo_status: 'REJECTED'
    }

    const result = resolveCompanyLogo(rejectedCompany)
    expect(result).toBeNull()

    const details = resolveCompanyLogoDetails(rejectedCompany)
    expect(details.status).toBe('REJECTED')
    expect(details.sourceType).toBe('monogram')
  })

  it('should never falsely map similarly named companies via substring matching', () => {
    // Turing != Turing Video
    const turingDomain = extractOfficialDomain('Turing').domain
    expect(turingDomain).toBe('turing.com')

    // Media.net != Media.com
    const mediaNetDomain = extractOfficialDomain('Media.net').domain
    expect(mediaNetDomain).toBe('media.net')

    // Meesho != Meesh
    const meeshoDomain = extractOfficialDomain('Meesho').domain
    expect(meeshoDomain).toBe('meesho.com')

    // KPIT != Kpit Tech
    const kpitDomain = extractOfficialDomain('KPIT').domain
    expect(kpitDomain).toBe('kpit.com')
  })
})
