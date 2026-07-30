/**
 * Shared TypeScript types for API communication.
 * These types mirror the API contract exactly.
 * All service functions use these as return types.
 */

// ── API Envelope ───────────────────────────────────────────────

/** Standard success response wrapping a single resource */
export interface ApiResponse<T> {
  data: T
}

/** Standard success response wrapping a collection with pagination metadata */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/** Pagination metadata returned on all list endpoints */
export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  applied_filters?: Record<string, unknown>
}

// ── Error Envelope ─────────────────────────────────────────────

/** Standard error response — matches the API contract exactly */
export interface ApiError {
  error: {
    code: ErrorCode
    message: string
    details?: FieldError[]
  }
}

/** Field-level validation error */
export interface FieldError {
  field: string
  message: string
}

/** All possible error codes from the API contract */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'AUTHENTICATION_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'ACCOUNT_DISABLED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

// ── Pagination Query Params ────────────────────────────────────

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface SortParams {
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// ── Common ─────────────────────────────────────────────────────

/** Utility type: make all properties optional (for PATCH requests) */
export type PartialUpdate<T> = Partial<T>

/** ISO 8601 datetime string (from backend timestamps) */
export type ISODateString = string

/** ISO 8601 date string YYYY-MM-DD */
export type ISODate = string

/** UUID v4 string */
export type UUID = string
