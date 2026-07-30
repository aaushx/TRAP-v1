import { apiClient } from './client'
import { ApiResponse } from '@/types/api.types'

export interface User {
  id: string
  email: string
  full_name: string
  target_role: string | null
  grad_year: number | null
  avatar_url: string | null
  college: string | null
  branch: string | null
  preferred_language: string | null
  preferences: Record<string, any> | null
  is_onboarded: boolean
  is_active: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponsePayload {
  user: User
  tokens: AuthTokens
}

export interface SearchResultItem {
  type: 'problem' | 'company' | 'goal' | 'topic'
  id: string
  title: string
  category: string
  description: string
  notes: string | null
  url: string
}

export const authApi = {
  async register(data: any): Promise<ApiResponse<AuthResponsePayload>> {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  async login(data: any): Promise<ApiResponse<AuthResponsePayload>> {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch('/users/me', data)
    return response.data
  },

  async changePassword(data: any): Promise<{ message: string }> {
    const response = await apiClient.post('/users/me/change-password', data)
    return response.data
  },

  async exportData(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/users/me/export')
    return response.data
  },

  async deleteAccount(): Promise<{ message: string }> {
    const response = await apiClient.delete('/users/me')
    return response.data
  },

  async searchAll(q: string): Promise<ApiResponse<SearchResultItem[]>> {
    const response = await apiClient.get('/search', { params: { q } })
    return response.data
  }
}
