import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  goalApi, 
  Goal, 
  TopicStatus, 
  GenerateGoalPayload,
  CompanyPreparationResponse 
} from '@/services/api/goal'

interface GoalState {
  goals: Goal[]
  currentGoal: Goal | null
  topicLibrary: any[]
  companyIntelligence: Record<string, any>
  companyPreparation: CompanyPreparationResponse | null
  isLoading: boolean
  isPrepLoading: boolean
  error: string | null

  // Actions
  fetchGoals: () => Promise<void>
  fetchGoalById: (id: string) => Promise<void>
  fetchLibraryAndCompanies: () => Promise<void>
  createGoal: (payload: GenerateGoalPayload) => Promise<Goal>
  updateTopicStatus: (topicId: string, status?: TopicStatus, notes?: string) => Promise<void>
  fetchCompanyPreparation: (goalId: string, params?: any) => Promise<void>
  updateQuestionProgress: (questionId: string, status: 'not_started' | 'attempted' | 'solved' | 'needs_revision', notes?: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  clearCurrentGoal: () => void
}

export const useGoalStore = create<GoalState>()(
  devtools((set, get) => ({
    goals: [],
    currentGoal: null,
    topicLibrary: [],
    companyIntelligence: {},
    companyPreparation: null,
    isLoading: false,
    isPrepLoading: false,
    error: null,

    fetchGoals: async () => {
      set({ isLoading: true, error: null })
      try {
        const goals = await goalApi.getAll()
        set({ goals, isLoading: false })
      } catch (err: any) {
        set({ 
          error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch goals', 
          isLoading: false 
        })
      }
    },

    fetchLibraryAndCompanies: async () => {
      try {
        const [topicLibrary, companyIntelligence] = await Promise.all([
          goalApi.getLibrary(),
          goalApi.getCompanies()
        ])
        set({ topicLibrary, companyIntelligence })
      } catch (err: any) {
        console.error('Failed to fetch library and companies', err)
      }
    },

    fetchGoalById: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        const goal = await goalApi.getById(id)
        set({ currentGoal: goal, isLoading: false })
      } catch (err: any) {
        set({ 
          error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch goal details', 
          isLoading: false 
        })
      }
    },

    createGoal: async (payload: GenerateGoalPayload) => {
      set({ isLoading: true, error: null })
      try {
        const goal = await goalApi.create(payload)
        set((state) => ({ 
          goals: [goal, ...state.goals], 
          currentGoal: goal,
          isLoading: false 
        }))
        return goal
      } catch (err: any) {
        set({ 
          error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create goal', 
          isLoading: false 
        })
        throw err
      }
    },

    updateTopicStatus: async (topicId: string, status?: TopicStatus, notes?: string) => {
      try {
        await goalApi.updateTopicStatus(topicId, status, notes)
        // Optimistically update local state
        const current = get().currentGoal
        if (current) {
          const updatedCategories = current.categories.map(cat => ({
            ...cat,
            topics: cat.topics.map(t => {
              if (t.id === topicId) {
                return { 
                  ...t, 
                  ...(status ? { status } : {}),
                  ...(notes !== undefined ? { notes } : {})
                }
              }
              return t
            })
          }))
          
          // Progress calculation: (Completed + Mastered) / Total * 100
          const allTopics = updatedCategories.flatMap(c => c.topics)
          const completedCount = allTopics.filter(t => t.status === 'completed' || t.status === 'mastered').length
          const progress = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0
          
          set({ 
            currentGoal: { 
              ...current, 
              categories: updatedCategories,
              progress 
            } 
          })
        }
      } catch (err: any) {
        console.error('Failed to update topic status', err)
        throw err
      }
    },

    fetchCompanyPreparation: async (goalId: string, params?: any) => {
      set({ isPrepLoading: true })
      try {
        const data = await goalApi.getCompanyPreparation(goalId, params)
        set({ companyPreparation: data, isPrepLoading: false })
      } catch (err: any) {
        console.error('Failed to fetch company preparation', err)
        set({ isPrepLoading: false })
      }
    },

    updateQuestionProgress: async (questionId: string, status: 'not_started' | 'attempted' | 'solved' | 'needs_revision', notes?: string) => {
      const currentPrep = get().companyPreparation
      if (currentPrep) {
        const updatedQuestions = currentPrep.questions.map(q => {
          if (q.id === questionId) {
            return { ...q, status, ...(notes !== undefined ? { user_notes: notes } : {}) }
          }
          return q
        })

        // Recalculate per-company statistics
        const updatedCompanyStats = currentPrep.company_stats.map(cs => {
          const cQuestions = updatedQuestions.filter(q => q.companies.includes(cs.company_name))
          const solved = cQuestions.filter(q => q.status === 'solved').length
          const total = cs.total_questions
          return {
            ...cs,
            solved_questions: solved,
            progress_percentage: total > 0 ? Math.round((solved / total) * 1000) / 10 : 0
          }
        })

        const totalUnique = currentPrep.total_unique_questions
        const solvedUnique = updatedQuestions.filter(q => q.status === 'solved').length
        const overallPct = totalUnique > 0 ? Math.round((solvedUnique / totalUnique) * 1000) / 10 : 0

        set({
          companyPreparation: {
            ...currentPrep,
            questions: updatedQuestions,
            company_stats: updatedCompanyStats,
            solved_unique_questions: solvedUnique,
            overall_progress_percentage: overallPct
          }
        })
      }

      await goalApi.updateQuestionProgress(questionId, status, notes)
    },

    deleteGoal: async (id: string) => {
      set({ isLoading: true, error: null })
      try {
        await goalApi.delete(id)
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id),
          currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
          isLoading: false
        }))
      } catch (err: any) {
        set({ 
          error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to delete goal', 
          isLoading: false 
        })
        throw err
      }
    },

    clearCurrentGoal: () => set({ currentGoal: null, companyPreparation: null })
  }),
  { name: 'goal-store' })
)
