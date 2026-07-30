import { useNavigate } from 'react-router-dom'
import { ArrowRight, Code2, Building2, Radar, Activity, Map } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="bg-bg-base text-primary font-sans antialiased selection:bg-secondary selection:text-white min-h-screen">
      
      {/* ── Fixed Floating Navbar ────────────────────────────────────────── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md rounded-full w-[95%] max-w-7xl border border-border-default shadow-sm">
        <div className="flex items-center gap-2 select-none">
          <img src="/logo.jpg" alt="TRA.P Logo" className="w-7 h-7 rounded" />
          <span className="font-display font-bold text-lg tracking-tighter text-primary uppercase">TRA.P</span>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <a className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors hover:bg-bg-container-low px-3 py-1.5 rounded-md" href="#features">Features</a>
          <a className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors hover:bg-bg-container-low px-3 py-1.5 rounded-md" href="#about">About</a>
          <a className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors hover:bg-bg-container-low px-3 py-1.5 rounded-md" href="#contact">Contact</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-mono font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="text-xs font-mono font-bold uppercase tracking-widest bg-primary text-white px-5 py-2.5 rounded hover:bg-secondary transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="pt-36 pb-20 px-4 md:px-16 max-w-7xl mx-auto dot-matrix min-h-[85vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border border-border-default px-3 py-1 rounded-full bg-white">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">System Online</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-7xl leading-[0.95] tracking-tighter text-primary uppercase font-bold">
              Everything.<br />
              <span className="text-text-secondary opacity-60">For Placements.</span>
            </h1>
            
            <p className="font-sans text-base md:text-lg text-text-secondary max-w-xl border-l-2 border-border-default pl-4 leading-relaxed">
              TRA.P helps students organize every aspect of placement preparation inside one beautiful, industrial-grade workspace. No clutter. Just execution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => navigate('/register')}
                className="bg-secondary text-white font-mono text-xs font-bold uppercase tracking-widest px-8 py-4 rounded hover:bg-primary transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="border border-border-default bg-white text-primary font-mono text-xs font-bold uppercase tracking-widest px-8 py-4 rounded hover:border-primary transition-colors cursor-pointer"
              >
                View Dashboard
              </button>
            </div>
          </div>

          {/* Right Wireframe Mockup */}
          <div className="lg:col-span-5 mt-12 lg:mt-0 relative">
            <div className="absolute inset-0 bg-bg-container-high transform translate-x-3 translate-y-3 rounded border border-border-default"></div>
            <div className="relative bg-white border border-border-default p-6 rounded shadow-sm">
              <div className="flex gap-1.5 mb-6 pb-4 border-b border-border-default border-dashed">
                <div className="w-2.5 h-2.5 rounded-full border border-border-default"></div>
                <div className="w-2.5 h-2.5 rounded-full border border-border-default"></div>
                <div className="w-2.5 h-2.5 rounded-full border border-border-default"></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider">READINESS INDEX</div>
                  <div className="font-display text-2xl font-bold text-primary">84%</div>
                </div>
                <div className="h-1.5 w-full bg-bg-container-low rounded overflow-hidden">
                  <div className="h-full bg-primary w-[84%]"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="border border-border-default p-4 bg-bg-base rounded">
                    <Code2 className="text-text-secondary w-5 h-5 mb-2" />
                    <div className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">DSA PROGRESS</div>
                    <div className="font-mono text-xs font-semibold text-primary">240/450 Solved</div>
                  </div>
                  <div className="border border-border-default p-4 bg-bg-base rounded">
                    <Building2 className="text-text-secondary w-5 h-5 mb-2" />
                    <div className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">APPLICATIONS</div>
                    <div className="font-mono text-xs font-semibold text-primary">12 Pipelines</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Core Bento Features Section ──────────────────────────────────── */}
      <section className="py-20 px-4 md:px-16 max-w-7xl mx-auto border-t border-border-default" id="features">
        <div className="mb-12">
          <div className="inline-block h-1.5 w-12 bg-primary mb-4"></div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary uppercase tracking-tighter mb-2">Core Systems</h2>
          <p className="font-sans text-sm md:text-base text-text-secondary max-w-lg">Engineered tools to track, analyze, and optimize your preparation workflow.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Readiness Index */}
          <div className="border border-border-default bg-white p-6 rounded flex flex-col justify-between hover:border-primary transition-colors group min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">SYSTEM 01</div>
                <h3 className="font-display text-lg font-bold text-primary uppercase leading-tight">Readiness Index</h3>
              </div>
              <Radar className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-bg-container border-t-secondary border-r-secondary transform rotate-45">
                <div className="absolute inset-0 flex items-center justify-center -rotate-45 font-display font-bold text-sm text-primary">A-</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider">Cohort Status</div>
                <div className="font-sans text-xs font-semibold text-primary">Top 15% Rank</div>
              </div>
            </div>
          </div>

          {/* DSA Tracker */}
          <div className="border border-border-default bg-white p-6 rounded flex flex-col justify-between hover:border-primary transition-colors group min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">SYSTEM 02</div>
                <h3 className="font-display text-lg font-bold text-primary uppercase leading-tight">DSA Tracker</h3>
              </div>
              <Code2 className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="space-y-1.5 mt-4">
              <div className="flex justify-between text-xs border-b border-border-default border-dashed pb-1">
                <span className="font-sans text-text-secondary">Easy Problems</span>
                <span className="font-mono font-bold text-primary">120/150</span>
              </div>
              <div className="flex justify-between text-xs border-b border-border-default border-dashed pb-1">
                <span className="font-sans text-text-secondary">Medium Problems</span>
                <span className="font-mono font-bold text-primary">85/200</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-sans text-text-secondary">Hard Problems</span>
                <span className="font-mono font-bold text-primary">15/100</span>
              </div>
            </div>
          </div>

          {/* Activity Matrix */}
          <div className="border border-border-default bg-white p-6 rounded flex flex-col justify-between hover:border-primary transition-colors group relative overflow-hidden min-h-[220px]">
            <div className="absolute inset-0 dot-matrix opacity-20 pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">SYSTEM 03</div>
                <h3 className="font-display text-lg font-bold text-primary uppercase leading-tight">Activity Matrix</h3>
              </div>
              <Activity className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="relative z-10 mt-auto flex flex-wrap gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const opacities = [0.1, 0.3, 0.6, 0.9]
                const randomOpacity = opacities[i % 4]
                const colorClass = i % 12 === 0 ? 'bg-secondary' : 'bg-primary'
                return (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 border border-border-subtle rounded-sm ${colorClass}`}
                    style={{ opacity: randomOpacity }}
                  />
                )
              })}
            </div>
          </div>

          {/* Company Pipeline */}
          <div className="border border-border-default bg-white p-6 rounded flex flex-col justify-between hover:border-primary transition-colors group min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-1">SYSTEM 04</div>
                <h3 className="font-display text-lg font-bold text-primary uppercase leading-tight">Company Pipeline</h3>
              </div>
              <Building2 className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="mt-4 border-l border-border-default pl-4 space-y-2 py-0.5">
              <div className="relative flex items-center justify-between text-xs">
                <span className="font-sans text-text-secondary">Applied Jobs</span>
                <span className="font-mono font-bold text-primary">12 Active</span>
              </div>
              <div className="relative flex items-center justify-between text-xs">
                <span className="font-sans text-text-secondary text-secondary">Interviews Scheduled</span>
                <span className="font-mono font-bold text-secondary">2 Scheduled</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── About Section ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-16 bg-bg-container-low border-t border-b border-border-default" id="about">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="h-1.5 w-12 bg-primary mb-6"></div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary uppercase tracking-tighter mb-4">The Fragmentation Problem</h2>
            <div className="font-sans text-sm md:text-base text-text-secondary space-y-4 leading-relaxed">
              <p>Placement preparation is broken. You track DSA problems in a random Excel sheet. You bookmark YouTube tutorials in a bloated browser folder. You write interview notes in scattered Google Docs.</p>
              <p>TRA.P unifies this chaos. We built a singular, high-performance workspace that consolidates your coding practice, roadmap progression, and application tracking into one austere dashboard.</p>
            </div>
          </div>
          
          <div className="relative h-[280px] border border-border-default bg-white p-6 rounded flex flex-col justify-center items-center text-center dot-matrix">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-bg-container-high dot-matrix-strip opacity-20"></div>
            <Map className="w-12 h-12 text-text-secondary mb-4" />
            <h3 className="font-display text-xl font-bold text-primary uppercase mb-2">Built for Focus</h3>
            <p className="font-sans text-xs text-text-secondary max-w-xs leading-relaxed">No gamification. No social feeds. Just metrics, data, and placement execution.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-default bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-16 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 select-none">
            <img src="/logo.jpg" alt="TRA.P Logo" className="w-6 h-6 rounded" />
            <span className="font-display font-bold text-base tracking-tighter text-primary uppercase">TRA.P</span>
          </div>
          
          <nav className="flex gap-6">
            <a className="font-mono text-[10px] font-bold text-text-secondary uppercase hover:text-secondary transition-colors" href="#">GitHub</a>
            <a className="font-mono text-[10px] font-bold text-text-secondary uppercase hover:text-secondary transition-colors" href="#">Privacy</a>
            <a className="font-mono text-[10px] font-bold text-text-secondary uppercase hover:text-secondary transition-colors" href="#">Terms</a>
          </nav>
          
          <p className="font-sans text-xs text-text-secondary text-center md:text-right">
            © {new Date().getFullYear()} TRA.P Placement Intelligence. Engineered for success.
          </p>
        </div>
      </footer>

    </div>
  )
}
export default LandingPage
