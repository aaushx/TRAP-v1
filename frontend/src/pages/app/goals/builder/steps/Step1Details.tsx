import { useBuilderContext } from '../GoalBuilder'
import { ArrowRight, Target, Clock, Calendar } from 'lucide-react'

interface Step1Props {
  roles: string[]
  companies: string[]
}

export function Step1Details({ roles, companies }: Step1Props) {
  const { state, setState, nextStep } = useBuilderContext()

  const isValid = state.title.trim() !== '' && state.targetRole !== ''

  const toggleCompany = (company: string) => {
    setState(prev => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(company)
        ? prev.targetCompanies.filter(c => c !== company)
        : [...prev.targetCompanies, company]
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Form Content */}
      <div className="flex-1 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Basic Information</h2>
          <p className="text-text-secondary text-sm">Let's start by defining the core details of your goal.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Goal Title *</label>
            <input 
              type="text" 
              value={state.title}
              onChange={e => setState(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. My Ultimate Google Prep"
              className="w-full bg-bg-base border border-border-default rounded-lg px-4 py-3 text-text-primary focus:border-violet-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
            <textarea 
              value={state.description}
              onChange={e => setState(p => ({ ...p, description: e.target.value }))}
              placeholder="What is the description of this goal?"
              className="w-full bg-bg-base border border-border-default rounded-lg px-4 py-3 text-text-primary focus:border-violet-400 focus:outline-none transition-colors resize-none h-24"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-secondary">Target Role *</label>
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setState(p => ({ ...p, targetRole: role }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    state.targetRole === role 
                      ? 'border-violet-400 bg-violet-400/10 text-violet-400' 
                      : 'border-border-default text-text-primary hover:bg-white/5'
                  }`}
                >
                  <span className="font-medium text-sm">{role}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Target Deadline (Optional)
              </label>
              <input 
                type="date" 
                value={state.deadline}
                onChange={e => setState(p => ({ ...p, deadline: e.target.value }))}
                className="w-full bg-bg-base border border-border-default rounded-lg px-4 py-3 text-text-primary focus:border-violet-400 focus:outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" /> Daily Study Hours
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" max="12" step="0.5"
                  value={state.dailyStudyHours}
                  onChange={e => setState(p => ({ ...p, dailyStudyHours: parseFloat(e.target.value) }))}
                  className="w-full accent-violet-400"
                />
                <span className="text-violet-400 font-bold min-w-[4ch]">{state.dailyStudyHours}h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-text-secondary flex items-center gap-2">
            Target Companies <span className="text-xs text-text-tertiary font-normal">(Used for insights & recommendations)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => {
              const isSelected = state.targetCompanies.includes(company)
              return (
                <button
                  key={company}
                  onClick={() => toggleCompany(company)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    isSelected 
                      ? 'border-violet-400 bg-violet-400/10 text-violet-400' 
                      : 'border-border-default text-text-primary hover:border-text-tertiary hover:bg-white/5'
                  }`}
                >
                  {company}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Live Summary Sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        <div className="sticky top-0 bg-white/[0.02] border border-border-default rounded-xl p-6">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            Live Summary
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-text-tertiary block mb-1">Title</span>
              <span className="text-text-primary font-medium">{state.title || '—'}</span>
            </div>
            <div>
              <span className="text-text-tertiary block mb-1">Role</span>
              <span className="text-text-primary font-medium">{state.targetRole || '—'}</span>
            </div>
            <div>
              <span className="text-text-tertiary block mb-1">Companies</span>
              <span className="text-text-primary font-medium">
                {state.targetCompanies.length > 0 ? state.targetCompanies.join(', ') : '—'}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary block mb-1">Pace</span>
              <span className="text-text-primary font-medium">{state.dailyStudyHours} hours/day</span>
            </div>
          </div>

          <button
            onClick={nextStep}
            disabled={!isValid}
            className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-glow-sm"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
