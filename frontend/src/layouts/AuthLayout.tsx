import { Outlet } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left side — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-bg-surface p-12 border-r border-border-subtle relative overflow-hidden">
        
        {/* Background ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-glow-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-sans text-2xl font-bold tracking-tight text-text-primary">
              TRAP
            </span>
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] text-text-primary tracking-tight">
            Stay Locked In <br /> Until You Succeed.
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-md leading-relaxed">
            Your all-in-one Placement Preparation Operating System. Replace your spreadsheets and notes with a premium, focused workspace.
          </p>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
