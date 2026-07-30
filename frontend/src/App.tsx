/**
 * Root App component — Milestone 1 placeholder.
 * Replaced with RouterProvider + layout system in Milestone 2.
 *
 * This component's purpose:
 * 1. Confirm Tailwind + design tokens are working
 * 2. Confirm fonts are loading correctly
 * 3. Confirm the Vite dev server is alive
 * 4. Show the brand identity before any real pages are built
 */

function App() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg-base">

      {/* ── Background ambient glow ─────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Center violet glow */}
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        {/* Top-left subtle glow */}
        <div
          className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="animate-slide-up relative z-10 flex flex-col items-center gap-8 px-6 text-center">

        {/* Brand icon */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 shadow-glow-violet"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Lightning bolt icon — representing "locked in" energy */}
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="font-sans text-6xl font-bold tracking-tighter text-text-primary"
            style={{ letterSpacing: '-0.04em' }}
          >
            TRAP
          </h1>
          <p className="font-sans text-lg font-medium text-text-secondary">
            Stay Locked In Until You Succeed.
          </p>
        </div>

        {/* Status badge */}
        <div className="glass-card flex items-center gap-2.5 px-4 py-2.5">
          {/* Pulsing green dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="font-mono text-sm font-medium text-text-secondary">
            v1.0 · Milestone 1 · Dev server running
          </span>
        </div>

        {/* Tech stack pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'React 18',
            'TypeScript',
            'Vite',
            'Tailwind CSS',
            'FastAPI',
            'PostgreSQL',
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border-subtle bg-bg-overlay px-3 py-1 font-mono text-xs text-text-tertiary"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <p className="absolute bottom-6 font-mono text-xs text-text-disabled">
        Placement Preparation OS · Building v1.0
      </p>
    </div>
  )
}

export default App
