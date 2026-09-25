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
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Bloomberg', 'Uber',
  'TikTok', 'Oracle', 'Apple', 'Goldman Sachs', 'TCS', 'Infosys',
  'Salesforce', 'IBM', 'LinkedIn', 'Zoho', 'Walmart Labs', 'Adobe',
  'Visa', 'Accenture', 'Nvidia', 'Yandex', 'D. E. Shaw', 'Flipkart',
  'PayPal', 'Snowflake', 'PhonePe', 'Citadel', 'Cisco', 'DoorDash'
]

const STEP_LABELS = [
  'Basic Information',
  'Focus Areas',
  'Topic Library',
  'Organize Milestones',
  'Review & Create',
]

/**
 * GoalBuilder component providing a full-page workspace for designing
 * a tailored, company-aligned DSA & placement preparation roadmap.
 */
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
      <div className="w-full max-w-[1400px] mx-auto pb-16 flex flex-col min-h-[calc(100vh-140px)]">
        {/* Workspace Top Navigation & Header */}
        <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link 
              to="/app/goals" 
              className="inline-flex items-center text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Goals
            </Link>
            <h1 className="text-2xl font-bold font-display text-primary flex items-center gap-2.5 uppercase tracking-tight">
              <Target className="w-6 h-6 text-primary" />
              Goal Workspace
            </h1>
            <p className="text-text-secondary mt-1 text-xs font-mono">
              Design your placement preparation roadmap, target companies, and milestones.
            </p>
          </div>
        </div>

        {/* Step Progress Stepper with Labels */}
        <div className="mb-8 relative max-w-4xl mx-auto w-full shrink-0 px-4">
          <div className="absolute left-8 right-8 top-5 h-0.5 bg-bg-container-high z-0" />
          <div 
            className="absolute left-8 top-5 h-0.5 bg-primary transition-all duration-300 z-0" 
            style={{ width: `calc(${((step - 1) / 4) * 100}% - ${((step - 1) / 4) * 16}px)` }}
          />
          <div className="relative z-10 flex justify-between items-start">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => s < step && setStep(s)}
                  disabled={s > step}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold transition-all text-xs border
                    ${step === s 
                      ? 'bg-primary text-text-inverse border-primary ring-4 ring-primary/10 shadow-sm' 
                      : step > s 
                      ? 'bg-primary text-text-inverse border-primary cursor-pointer hover:bg-secondary' 
                      : 'bg-bg-surface border-border-default text-text-tertiary cursor-not-allowed'}
                  `}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </button>
                <span className={`mt-2 text-[11px] font-mono uppercase tracking-wider hidden md:block ${
                  step === s ? 'font-bold text-primary' : 'text-text-tertiary'
                }`}>
                  {STEP_LABELS[s - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Step Content Container */}
        <div className="flex-1 w-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full flex-1 flex flex-col"
            >
              {step === 1 && <Step1Details roles={ROLES} companies={COMPANIES} />}
              {step === 2 && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm flex-1 flex flex-col relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />
                  <Step2Categories />
                </div>
              )}
              {step === 3 && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm flex-1 flex flex-col relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />
                  <Step3TopicLibrary />
                </div>
              )}
              {step === 4 && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm flex-1 flex flex-col relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />
                  <Step4Organize />
                </div>
              )}
              {step === 5 && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm flex-1 flex flex-col relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-xl opacity-25 dot-matrix-strip" />
                  <Step5Review />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </BuilderContext.Provider>
  )
}
