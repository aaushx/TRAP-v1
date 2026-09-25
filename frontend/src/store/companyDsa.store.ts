import { create } from 'zustand'
import {
  companyDsaApi,
  CompanyDsaListItem,
  CompanyDsaDetail,
  CompanyDsaQuestionItem,
  QuestionFilterParams
} from '@/services/api/companyDsa'

interface CompanyDsaState {
  companies: CompanyDsaListItem[]
  isLoadingCompanies: boolean
  currentCompany: CompanyDsaDetail | null
  isLoadingDetail: boolean
  questions: CompanyDsaQuestionItem[]
  totalQuestions: number
  currentPage: number
  totalPages: number
  isLoadingQuestions: boolean
  activeFilter: string
  searchQuery: string
  error: string | null

  // Actions
  fetchCompanies: (search?: string, filter?: string) => Promise<void>
  fetchCompanyDetail: (slug: string) => Promise<void>
  fetchQuestions: (slug: string, params?: QuestionFilterParams) => Promise<void>
  updateQuestionStatus: (
    questionId: string,
    status: 'not_started' | 'attempted' | 'solved' | 'needs_revision',
    notes?: string
  ) => Promise<void>
  setActiveFilter: (filter: string) => void
  setSearchQuery: (query: string) => void
}

export const useCompanyDsaStore = create<CompanyDsaState>((set, get) => ({
  companies: [],
  isLoadingCompanies: false,
  currentCompany: null,
  isLoadingDetail: false,
  questions: [],
  totalQuestions: 0,
  currentPage: 1,
  totalPages: 1,
  isLoadingQuestions: false,
  activeFilter: 'all',
  searchQuery: '',
  error: null,

  fetchCompanies: async (search?: string, filter?: string) => {
    set({ isLoadingCompanies: true, error: null })
    try {
      const data = await companyDsaApi.getCompanies(search, filter)
      set({ companies: data, isLoadingCompanies: false })
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch companies',
        isLoadingCompanies: false
      })
    }
  },

  fetchCompanyDetail: async (slug: string) => {
    set({ isLoadingDetail: true, error: null })
    try {
      const data = await companyDsaApi.getCompanyDetail(slug)
      set({ currentCompany: data, isLoadingDetail: false })
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch company details',
        isLoadingDetail: false
      })
    }
  },

  fetchQuestions: async (slug: string, params?: QuestionFilterParams) => {
    set({ isLoadingQuestions: true, error: null })
    try {
      const data = await companyDsaApi.getCompanyQuestions(slug, params)
      set({
        questions: data.items,
        totalQuestions: data.total,
        currentPage: data.page,
        totalPages: data.total_pages,
        isLoadingQuestions: false
      })
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Failed to fetch questions',
        isLoadingQuestions: false
      })
    }
  },

  updateQuestionStatus: async (
    questionId: string,
    status: 'not_started' | 'attempted' | 'solved' | 'needs_revision',
    notes?: string
  ) => {
    const prevQuestions = get().questions
    const prevCompany = get().currentCompany

    // Optimistic update on current question
    const updatedQuestions = prevQuestions.map((q) =>
      q.id === questionId ? { ...q, status, notes: notes !== undefined ? notes : q.notes } : q
    )
    set({ questions: updatedQuestions })

    try {
      await companyDsaApi.updateQuestionStatus(questionId, status, notes)
      // Refetch detail in background to update real metrics
      if (prevCompany) {
        companyDsaApi.getCompanyDetail(prevCompany.slug).then((detail) => {
          set({ currentCompany: detail })
        })
      }
    } catch {
      // Rollback on failure
      set({ questions: prevQuestions, error: 'Failed to update question status' })
    }
  },

  setActiveFilter: (filter: string) => set({ activeFilter: filter }),
  setSearchQuery: (query: string) => set({ searchQuery: query })
}))
