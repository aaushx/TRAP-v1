import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query client configuration.
 * These defaults are tuned for TRAP's data patterns:
 *
 * - staleTime: How long data is considered "fresh" (no background refetch).
 *   Problems/companies change infrequently — 5 minutes is reasonable.
 *
 * - gcTime (formerly cacheTime): How long inactive data stays in memory.
 *   10 minutes allows users to navigate back without a network request.
 *
 * - retry: Retry failed requests up to 2 times.
 *   On 401 (token expired), the axios interceptor handles refresh —
 *   don't let Query retry before the refresh completes.
 *
 * - refetchOnWindowFocus: Refetch when tab becomes active.
 *   Useful for dashboard (streak might change), disabled for analytics
 *   (heavy queries — let user manually refresh if needed).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401 (auth errors) or 404 (not found)
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations — prefer explicit user re-try
      retry: false,
    },
  },
})
