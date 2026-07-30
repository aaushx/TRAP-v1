import { apiClient } from './client'

export interface DashboardStats {
  user: { full_name: string; email: string }
  stats: {
    problems_solved: number
    current_streak: number
    companies_tracked: number
    daily_goal_progress: number
    daily_goal_target: number
    active_goals: number
  }
  recent_activity: Array<{
    id: string
    description: string
    timestamp: string
    type: string
  }>
  heatmap_data: Record<string, number>
}

export interface ReadinessStats {
  placement_readiness_index: number
  strengths: string[]
  needs_improvement: string[]
  daily_focus: string[]
  remaining_study_time: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get('/dashboard/stats')
  return response.data.data
}

export async function getReadinessStats(): Promise<ReadinessStats> {
  const response = await apiClient.get('/dashboard/readiness')
  return response.data
}
