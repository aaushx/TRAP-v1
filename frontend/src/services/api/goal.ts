import { apiClient } from './client'

export type GoalStatus = 'active' | 'completed' | 'archived'
export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'bookmarked' | 'needs_revision' | 'mastered'
export type TopicDifficulty = 'easy' | 'medium' | 'hard'

export interface GoalTopic {
  id: string
  name: string
  difficulty: TopicDifficulty
  estimated_hours: number
  status: TopicStatus
  resource_links: string[]
  notes?: string
}

export interface GoalCategory {
  id: string
  name: string
  description?: string
  topics: GoalTopic[]
}

export interface Goal {
  id: string
  title: string
  description?: string
  target_role: string
  target_companies: string[]
  status: GoalStatus
  categories: GoalCategory[]
  progress: number
  created_at: string
  updated_at: string
}

export interface GenerateGoalPayload {
  title: string
  description?: string
  target_role: string
  target_companies: string[]
  deadline?: string
  priority?: string
  categories: {
    name: string
    sort_order: number
    topics: {
      name: string
      difficulty?: TopicDifficulty
      estimated_hours?: number
      sort_order: number
    }[]
  }[]
}

export const goalApi = {
  create: async (payload: GenerateGoalPayload) => {
    const response = await apiClient.post<Goal>('/goals/', payload)
    return response.data
  },

  getLibrary: async () => {
    const response = await apiClient.get<any[]>('/goals/library')
    return response.data
  },

  getCompanies: async () => {
    const response = await apiClient.get<Record<string, any>>('/goals/companies')
    return response.data
  },
  
  getAll: async () => {
    const response = await apiClient.get<Goal[]>('/goals')
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get<Goal>(`/goals/${id}`)
    return response.data
  },
  
  updateTopicStatus: async (topicId: string, status?: TopicStatus, notes?: string) => {
    const payload: any = {}
    if (status) payload.status = status
    if (notes !== undefined) payload.notes = notes
    const response = await apiClient.patch<{ success: boolean }>(`/goals/topics/${topicId}/status`, payload)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/goals/${id}`)
  },

  getCompanyPreparation: async (goalId: string, params?: {
    company?: string
    topic?: string
    difficulty?: string
    status?: string
    search?: string
    skip?: number
    limit?: number
  }) => {
    const response = await apiClient.get<CompanyPreparationResponse>(`/goals/${goalId}/company-preparation`, { params })
    return response.data
  },

  updateQuestionProgress: async (questionId: string, status: 'not_started' | 'attempted' | 'solved' | 'needs_revision', notes?: string) => {
    const response = await apiClient.patch(`/goals/questions/${questionId}/progress`, { status, notes })
    return response.data
  }
}

export interface CompanyQuestion {
  id: string
  title: string
  slug: string
  difficulty: string
  platform_url?: string
  topics: string[]
  companies: string[]
  company_count: number
  acceptance_rate?: string
  frequency?: string
  status: 'not_started' | 'attempted' | 'solved' | 'needs_revision'
  user_notes?: string
}

export interface CompanyPreparationStats {
  company_name: string
  total_questions: number
  solved_questions: number
  progress_percentage: number
  topics_covered: number
  total_topics: number
}

export interface TopicPreparationBreakdown {
  topic_name: string
  total_questions: number
  solved_questions: number
}

export interface CompanyPreparationResponse {
  goal_id: string
  goal_title: string
  target_companies: string[]
  overall_progress_percentage: number
  total_unique_questions: number
  solved_unique_questions: number
  company_stats: CompanyPreparationStats[]
  topic_breakdown: TopicPreparationBreakdown[]
  questions: CompanyQuestion[]
}
