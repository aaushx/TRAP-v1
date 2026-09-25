/**
 * TRAP — Client-Side Logo.dev Image API Helper
 * 
 * Provides authenticated URL generation for the Logo.dev Image CDN (https://img.logo.dev).
 * Consumes ONLY the client-side Publishable Key (VITE_LOGO_DEV_PUBLISHABLE_KEY).
 * 
 * SECURITY:
 * - NEVER imports or references the server-side Secret Key (LOGO_DEV_SECRET_KEY).
 * - Safe for direct client-side execution in React browser applications.
 */

export interface LogoDevImageOptions {
  /** Pixel size preset or dimension (e.g. 128, 256) */
  size?: number
  /** Output image format: 'png' | 'jpg' */
  format?: 'png' | 'jpg'
  /** High-DPI 2x retina asset */
  retina?: boolean
  /** Dark or Light mode brandmark preference */
  theme?: 'dark' | 'light'
}

/**
 * Builds a valid Logo.dev Image API URL for a verified official domain.
 * 
 * @param domain - The official domain (e.g., 'google.com', 'capgemini.com').
 * @param options - Optional sizing, format, and theme options.
 * @returns The signed Logo.dev CDN URL or null if unconfigured/invalid.
 */
export function buildLogoDevUrl(
  domain: string | null | undefined,
  options?: LogoDevImageOptions
): string | null {
  if (!domain) return null

  // Normalize domain
  let cleanDomain = domain.trim().toLowerCase()
  // Remove protocol and trailing paths if present
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  if (!cleanDomain || !cleanDomain.includes('.')) {
    return null
  }

  const publishableKey = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY
  if (!publishableKey || !publishableKey.trim()) {
    // Return null if Publishable Key is not configured
    return null
  }

  const params = new URLSearchParams()
  params.set('token', publishableKey.trim())

  if (options?.size) {
    params.set('size', options.size.toString())
  }
  if (options?.format) {
    params.set('format', options.format)
  }
  if (options?.retina) {
    params.set('retina', 'true')
  }
  if (options?.theme) {
    params.set('theme', options.theme)
  }

  return `https://img.logo.dev/${cleanDomain}?${params.toString()}`
}
