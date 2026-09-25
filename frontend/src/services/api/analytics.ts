/**
 * Analytics API Service for TRAP Placement Preparation Operating System.
 * 
 * Fetches real analytical aggregations from backend endpoints including problems breakdown,
 * application pipeline funnel, goal progress distributions, and study trends.
 */

import { apiClient } from './client'

export interface ProblemDifficultyStats {
  easy: number
  medium: number
  hard: number
}

export interface ProblemPlatformStats {
  platform: string
  count: number
}

export interface ProblemTopicStats {
  topic: string
  count: number
}

export interface ProblemsAnalytics {
  total_solved: number
  total_tracked: number
  by_difficulty: ProblemDifficultyStats
  by_platform: ProblemPlatformStats[]
  by_topic: ProblemTopicStats[]
}

export interface CompanyFunnelStats {
  wishlist: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
}

export interface CompaniesAnalytics {
  total_tracked: number
  funnel: CompanyFunnelStats
  by_role: Record<string, number>
  recent_applications: Array<{
    name: string
    role: string
    status: string
    applied_date: string | null
  }>
}

export interface GoalTopicStatusBreakdown {
  not_started: number
  bookmarked: number
  in_progress: number
  needs_revision: number
  completed: number
  mastered: number
  skipped: number
}

export interface CategoryProgressItem {
  name: string
  completed_topics: number
  total_topics: number
  percentage: number
  estimated_hours_remaining: number
}

export interface GoalsAnalytics {
  total_goals: number
  active_goals: number
  completed_goals: number
  average_progress: number
  total_topics: number
  completed_topics: number
  topic_status_breakdown: GoalTopicStatusBreakdown
  category_progress: CategoryProgressItem[]
}

export interface ActivityTrendItem {
  date: string
  problems_solved: number
}

export interface StudyDistributionItem {
  category: string
  estimated_hours_remaining: number
  topics_count: number
}

export interface ReadinessAnalytics {
  placement_readiness_index: number
  strengths: string[]
  needs_improvement: string[]
  current_streak: number
  remaining_study_time: number
}

export interface AnalyticsSummary {
  problems: ProblemsAnalytics
  companies: CompaniesAnalytics
  goals: GoalsAnalytics
  readiness: ReadinessAnalytics
  activity_trends: ActivityTrendItem[]
  study_distribution: StudyDistributionItem[]
}

export const analyticsApi = {
  /**
   * Fetch complete analytics summary.
   */
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/analytics/')
    return response.data
  },

  /**
   * Fetch problem solving metrics only.
   */
  getProblems: async (): Promise<ProblemsAnalytics> => {
    const response = await apiClient.get<ProblemsAnalytics>('/analytics/problems')
    return response.data
  },

  /**
   * Fetch company application funnel analytics.
   */
  getCompanies: async (): Promise<CompaniesAnalytics> => {
    const response = await apiClient.get<CompaniesAnalytics>('/analytics/companies')
    return response.data
  },

  /**
   * Fetch goal progress and coverage analytics.
   */
  getGoals: async (): Promise<GoalsAnalytics> => {
    const response = await apiClient.get<GoalsAnalytics>('/analytics/goals')
    return response.data
  },

  /**
   * Fetch placement readiness and strengths.
   */
  getReadiness: async (): Promise<ReadinessAnalytics> => {
    const response = await apiClient.get<ReadinessAnalytics>('/analytics/readiness')
    return response.data
  },
}
