/// <reference types="vite/client" />

/**
 * Type declarations for Vite environment variables.
 * Only VITE_ prefixed variables are exposed to the client.
 * Add new variables here as they are added to .env.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
