/**
 * TRAP — Universal CompanyLogo Component
 * 
 * Implements the strict Logo Priority Hierarchy:
 * 1. VERIFIED official company domain → Logo.dev Image API (CDN)
 * 2. If Logo.dev fails or domain is null → check approved local verified asset
 * 3. Clean styled monogram fallback (initial letter avatar)
 * 
 * NEVER uses unverified legacy SVGs.
 */

import React, { useState } from 'react'
import {
  resolveCompanyLogo,
  APPROVED_LOCAL_LOGOS,
  normalizeCompanyLookupKey,
  CompanyLogoInput
} from '@/config/companyLogos'

export type CompanyLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

export interface CompanyLogoProps {
  /**
   * Company record object or company name/domain string.
   */
  company?: string | CompanyLogoInput | null
  /**
   * Optional direct company name override.
   */
  name?: string
  /**
   * Optional direct company slug override.
   */
  slug?: string
  /**
   * Optional official domain override.
   */
  domain?: string
  /**
   * Size presets or custom pixel dimension:
   * - xs: 20px
   * - sm: 28px
   * - md: 40px (default, used for company cards)
   * - lg: 56px (used for company preparation banner)
   * - xl: 64px
   */
  size?: CompanyLogoSize
  /**
   * Custom classes applied directly to the image or fallback text.
   */
  className?: string
  /**
   * Custom classes applied to the outer container.
   */
  containerClassName?: string
  /**
   * Custom classes applied specifically to the fallback text avatar.
   */
  fallbackClassName?: string
  /**
   * Accessibility alt text override.
   */
  alt?: string
  /**
   * Whether to wrap the logo in a styled neutral background container with borders.
   * Defaults to true.
   */
  showContainer?: boolean
}

const SIZE_CONFIGS: Record<
  'xs' | 'sm' | 'md' | 'lg' | 'xl',
  { container: string; imgPadding: string; textSize: string; rounded: string }
> = {
  xs: { container: 'w-5 h-5', imgPadding: 'p-0.5', textSize: 'text-[10px]', rounded: 'rounded' },
  sm: { container: 'w-7 h-7', imgPadding: 'p-1', textSize: 'text-xs', rounded: 'rounded-md' },
  md: { container: 'w-10 h-10', imgPadding: 'p-2', textSize: 'text-base font-bold', rounded: 'rounded-lg' },
  lg: { container: 'w-14 h-14', imgPadding: 'p-2.5', textSize: 'text-2xl font-extrabold', rounded: 'rounded-xl' },
  xl: { container: 'w-16 h-16', imgPadding: 'p-3', textSize: 'text-3xl font-extrabold', rounded: 'rounded-2xl' },
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  company,
  name,
  slug,
  domain,
  size = 'md',
  className = '',
  containerClassName = '',
  fallbackClassName = '',
  alt,
  showContainer = true,
}) => {
  const [logoFailed, setLogoFailed] = useState(false)
  const [localFailed, setLocalFailed] = useState(false)

  // Construct robust target company identifier
  let companyIdentifier: string | CompanyLogoInput | null = null
  if (typeof company === 'object' && company !== null) {
    companyIdentifier = {
      ...company,
      name: name || company.name,
      slug: slug || company.slug,
      official_domain: domain || company.official_domain || (company as { domain?: string }).domain,
    }
  } else if (typeof company === 'string') {
    companyIdentifier = domain ? { name: company, official_domain: domain } : company
  } else if (name || slug || domain) {
    companyIdentifier = { name, slug, official_domain: domain }
  }

  const displayName =
    name ||
    (typeof company === 'string'
      ? company
      : company?.name || company?.slug || 'Company')

  const initial = displayName.trim().charAt(0).toUpperCase() || 'C'

  // 1. Primary runtime resolution via Logo.dev
  const primaryLogoUrl = resolveCompanyLogo(companyIdentifier)

  // Development-only diagnostic logging (Safe: never prints key)
  if (import.meta.env.DEV) {
    const isConfigured = Boolean(import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY)
    if (!primaryLogoUrl) {
      console.debug(
        "[CompanyLogo]",
        displayName,
        "domain:",
        typeof companyIdentifier === 'object' ? companyIdentifier?.official_domain : "unresolved",
        "logoConfigured:",
        isConfigured,
        "resolved: none (monogram fallback)"
      )
    }
  }

  // 2. Check for approved local verified asset if primary failed
  const companySlug =
    typeof companyIdentifier === 'object' && companyIdentifier?.slug
      ? companyIdentifier.slug
      : normalizeCompanyLookupKey(typeof companyIdentifier === 'string' ? companyIdentifier : displayName)

  const approvedLocalAsset = companySlug && APPROVED_LOCAL_LOGOS[companySlug] ? APPROVED_LOCAL_LOGOS[companySlug] : null

  // Determine size styling
  const isPreset = typeof size === 'string' && size in SIZE_CONFIGS
  const sizePreset = isPreset ? (size as 'xs' | 'sm' | 'md' | 'lg' | 'xl') : 'md'
  const config = SIZE_CONFIGS[sizePreset]

  const customStyle: React.CSSProperties =
    typeof size === 'number' ? { width: size, height: size } : {}

  // Render Fallback Monogram Avatar
  const renderMonogram = () => (
    <span
      className={`font-mono select-none text-text-primary ${config.textSize} ${fallbackClassName}`}
    >
      {initial}
    </span>
  )

  // Determine which image URL to render based on failure state
  let currentImageUrl: string | null = null
  let onImageError: () => void = () => setLogoFailed(true)

  if (primaryLogoUrl && !logoFailed) {
    currentImageUrl = primaryLogoUrl
    onImageError = () => setLogoFailed(true)
  } else if (approvedLocalAsset && !localFailed) {
    currentImageUrl = approvedLocalAsset
    onImageError = () => setLocalFailed(true)
  }

  // 3. Fallback to clean monogram if no URL or all image candidates failed
  if (!currentImageUrl) {
    if (!showContainer) {
      return renderMonogram()
    }
    return (
      <div
        style={customStyle}
        className={`${config.container} ${config.rounded} bg-bg-base border border-border-default flex items-center justify-center shrink-0 transition-colors shadow-inner ${containerClassName}`}
        title={displayName}
      >
        {renderMonogram()}
      </div>
    )
  }

  // Render Image
  const imgElement = (
    <img
      src={currentImageUrl}
      alt={alt || `${displayName} logo`}
      loading="lazy"
      onError={onImageError}
      className={`w-full h-full object-contain select-none transition-opacity duration-200 ${className}`}
    />
  )

  if (!showContainer) {
    return (
      <div
        style={customStyle}
        className={`inline-flex items-center justify-center shrink-0 ${isPreset ? config.container : ''} ${containerClassName}`}
      >
        {imgElement}
      </div>
    )
  }

  return (
    <div
      style={customStyle}
      className={`
        ${config.container} ${config.rounded} ${config.imgPadding}
        bg-bg-base border border-border-default
        flex items-center justify-center shrink-0
        transition-all duration-200 overflow-hidden
        ${containerClassName}
      `}
      title={displayName}
    >
      {imgElement}
    </div>
  )
}

export default CompanyLogo
