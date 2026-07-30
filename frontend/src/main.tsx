/**
 * Application entry point.
 * Sets up all global providers and renders the app.
 *
 * Provider hierarchy (outermost → innermost):
 * QueryClientProvider → StrictMode → App
 *
 * Note: RouterProvider is added in Milestone 2 (Routing & Auth).
 * ThemeProvider is added in Milestone 2 as well.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { queryClient } from '@/config/queryClient'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

// ── Global Styles ─────────────────────────────────────────────
// global.css imports tokens.css and all @fontsource fonts
import '@/styles/global.css'

// ── Mount ─────────────────────────────────────────────────────
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    '[TRAP] Root element #root not found. Check that index.html has <div id="root"></div>.'
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* DevTools only visible in development — tree-shaken from production build */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
