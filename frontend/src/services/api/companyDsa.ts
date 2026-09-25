import { apiClient } from './client'

export interface CompanyDsaListItem {
  id: string
  name: string
  slug: string
  aliases: string[]
  question_count: number
  is_top_30: boolean
  rank: number | null
  user_solved_count: number
  remaining_count: number
  user_progress_percentage: number
  official_domain?: string | null
  logo_provider?: string | null
  logo_status?: string | null
}

export interface DifficultyStat {
  total: number
  solved: number
}

export interface TopicStat {
  topic: string
  total: number
  solved: number
  progress: number
}

export interface CompanyDsaDetail {
  id: string
  name: string
  slug: string
  question_count: number
  solved_count: number
  attempted_count: number
  needs_revision_count: number
  remaining_count: number
  progress_percentage: number
  difficulty_breakdown: Record<string, DifficultyStat>
  topic_breakdown: TopicStat[]
  official_domain?: string | null
  logo_provider?: string | null
  logo_status?: string | null
}

export interface CompanyDsaQuestionItem {
  id: string
  external_id?: string | null
  title: string
  slug: string
  difficulty: string
  platform_url: string | null
  topics: string[]
  frequency: string | null
  time_periods?: string[]
  companies: string[]
  status: 'not_started' | 'attempted' | 'solved' | 'needs_revision'
  notes: string | null
}

export interface QuestionDetail {
  id: string
  external_id?: string | null
  title: string
  slug: string
  difficulty: string
  platform_url: string | null
  topics: string[]
  frequency: string | null
  acceptance_rate: string | null
  companies: string[]
  company_count: number
  status: 'not_started' | 'attempted' | 'solved' | 'needs_revision'
  notes: string | null
}

export interface PaginatedQuestionsResponse {
  items: CompanyDsaQuestionItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface QuestionFilterParams {
  topic?: string
  difficulty?: string
  status?: string
  time_period?: string
  sort_by?: string
  search?: string
  page?: number
  page_size?: number
}

export interface CompanyGoalItem {
  id: string
  title: string
  target_role: string
  target_companies: string[]
  company_details: Array<{
    company_id: string
    name: string
    slug: string
    question_count: number
    solved_count: number
    remaining_count: number
    progress_percentage: number
  }>
  total_target_questions: number
  total_solved_questions: number
  overall_progress: number
  status: string
}

export const companyDsaApi = {
  async getCompanies(search?: string, filter?: string): Promise<CompanyDsaListItem[]> {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (filter) params.filter = filter
    const res = await apiClient.get('/company-dsa/companies', { params })
    return res.data?.data ?? []
  },

  async getCompanyDetail(slug: string): Promise<CompanyDsaDetail> {
    const res = await apiClient.get(`/company-dsa/companies/${slug}`)
    return res.data?.data
  },

  async getCompanyQuestions(slug: string, params?: QuestionFilterParams): Promise<PaginatedQuestionsResponse> {
    const res = await apiClient.get(`/company-dsa/companies/${slug}/questions`, { params })
    return res.data?.data ?? { items: [], total: 0, page: 1, page_size: 20, total_pages: 1 }
  },

  async getQuestionDetail(questionId: string): Promise<QuestionDetail> {
    const res = await apiClient.get(`/company-dsa/questions/${questionId}`)
    return res.data?.data
  },

  async updateQuestionStatus(
    questionId: string,
    status: 'not_started' | 'attempted' | 'solved' | 'needs_revision',
    notes?: string
  ): Promise<any> {
    const res = await apiClient.patch(`/company-dsa/questions/${questionId}/status`, { status, notes })
    return res.data?.data
  },

  async createCompanyGoal(companySlugs: string[], title?: string): Promise<CompanyGoalItem> {
    const res = await apiClient.post('/company-dsa/goals/company', { company_slugs: companySlugs, title })
    return res.data?.data
  },

  async getCompanyGoals(): Promise<CompanyGoalItem[]> {
    const res = await apiClient.get('/company-dsa/goals/company')
    return res.data?.data ?? []
  },

  async deleteCompanyGoal(goalId: string): Promise<void> {
    await apiClient.delete(`/company-dsa/goals/company/${goalId}`)
  }
}
