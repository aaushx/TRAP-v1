import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { goalApi, Goal, TopicStatus, GenerateGoalPayload } from '@/services/api/goal'

interface GoalState {
  goals: Goal[]
  currentGoal: Goal | null
  topicLibrary: any[]
  companyIntelligence: Record<string, any>
  isLoading: boolean
  error: string | null

  // Actions
  fetchGoals: () => Promise<void>
  fetchGoalById: (id: string) => Promise<void>
  fetchLibraryAndCompanies: () => Promise<void>
  createGoal: (payload: GenerateGoalPayload) => Promise<Goal>
  updateTopicStatus: (topicId: string, status?: TopicStatus, notes?: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  clearCurrentGoal: () => void
}

export const useGoalStore = create<GoalState>()(
  devtools((set, get) => ({
    goals: [],
    currentGoal: null,
    topicLibrary: [],
    companyIntelligence: {},
    isLoading: false,
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

    clearCurrentGoal: () => set({ currentGoal: null })
  }),
  { name: 'goal-store' })
)
