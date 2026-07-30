import { useState, useEffect, createContext, useContext } from 'react'
import { Link } from 'react-router-dom'
import { useGoalStore } from '@/store/goal.store'
import { ArrowLeft, CheckCircle2, Target } from 'lucide-react'
import { Step1Details } from './steps/Step1Details'
import { Step2Categories } from './steps/Step2Categories'
import { Step3TopicLibrary } from './steps/Step3TopicLibrary'
import { Step4Organize } from './steps/Step4Organize'
import { Step5Review } from './steps/Step5Review'
import { AnimatePresence, motion } from 'framer-motion'

export interface BuilderState {
  title: string
  description: string
  targetRole: string
  targetCompanies: string[]
  deadline: string
  priority: string
  dailyStudyHours: number
  selectedCategories: string[]
  selectedTopics: any[]
  milestones: { id: string, name: string, topics: any[] }[]
}

interface BuilderContextType {
  state: BuilderState
  setState: React.Dispatch<React.SetStateAction<BuilderState>>
  nextStep: () => void
  prevStep: () => void
}

const BuilderContext = createContext<BuilderContextType | null>(null)

export const useBuilderContext = () => {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error("useBuilderContext must be used within GoalBuilder")
  return ctx
}

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 
  'Full Stack Developer', 'Data Analyst', 'Data Scientist',
]

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Apple', 'Meta',
  'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'IBM'
]

export default function GoalBuilder() {
  const { fetchLibraryAndCompanies } = useGoalStore()

  useEffect(() => {
    fetchLibraryAndCompanies()
  }, [fetchLibraryAndCompanies])

  const [step, setStep] = useState(1)
  const [state, setState] = useState<BuilderState>({
    title: '',
    description: '',
    targetRole: '',
    targetCompanies: [],
    deadline: '',
    priority: 'Medium',
    dailyStudyHours: 2,
    selectedCategories: [],
    selectedTopics: [],
    milestones: []
  })

  const nextStep = () => setStep((s) => Math.min(s + 1, 5))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  return (
    <BuilderContext.Provider value={{ state, setState, nextStep, prevStep }}>
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="mb-6 shrink-0">
          <Link to="/app/goals" className="inline-flex items-center text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Goals
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Target className="w-6 h-6 text-violet-400" />
                Goal Workspace
              </h1>
              <p className="text-text-secondary mt-1 text-sm">Design your ultimate preparation goal.</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6 relative max-w-3xl mx-auto w-full shrink-0">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-500 rounded-full z-0 transition-all duration-300" 
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 transition-colors text-sm
                ${step === s ? 'bg-violet-500 text-white shadow-glow-sm' : 
                  step > s ? 'bg-violet-500 text-white' : 'bg-bg-surface border-2 border-white/10 text-text-tertiary'}
              `}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 bg-bg-surface border border-border-default rounded-xl shadow-glow-sm overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-6 md:p-8"
            >
              {step === 1 && <Step1Details roles={ROLES} companies={COMPANIES} />}
              {step === 2 && <Step2Categories />}
              {step === 3 && <Step3TopicLibrary />}
              {step === 4 && <Step4Organize />}
              {step === 5 && <Step5Review />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BuilderContext.Provider>
  )
}
