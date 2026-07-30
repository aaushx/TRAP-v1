import { apiClient } from './client';

export type Platform = 'leetcode' | 'gfg' | 'hackerrank' | 'codeforces' | 'interviewbit' | 'other';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Status = 'solved' | 'revisit' | 'attempted' | 'skipped';

export interface Problem {
  id: string;
  title: string;
  platform: Platform;
  topic?: string;
  difficulty: Difficulty;
  status: Status;
  platform_url?: string;
  notes?: string;
  is_bookmarked: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type ProblemCreate = Omit<Problem, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ProblemUpdate = Partial<ProblemCreate>;

export interface ProblemQueryParams {
  search?: string;
  difficulty?: Difficulty;
  status?: Status;
  platform?: string;
  is_bookmarked?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

export const getProblems = async (params?: ProblemQueryParams): Promise<Problem[]> => {
  const { data } = await apiClient.get('/problems/', { params });
  return data?.data ?? data;
};

export const getProblem = async (id: string): Promise<Problem> => {
  const { data } = await apiClient.get(`/problems/${id}`);
  return data?.data ?? data;
};

export const createProblem = async (problem: ProblemCreate): Promise<Problem> => {
  const { data } = await apiClient.post('/problems/', problem);
  return data?.data ?? data;
};

export const updateProblem = async (id: string, problem: ProblemUpdate): Promise<Problem> => {
  const { data } = await apiClient.put(`/problems/${id}`, problem);
  return data?.data ?? data;
};

export const deleteProblem = async (id: string): Promise<void> => {
  await apiClient.delete(`/problems/${id}`);
};

export const bulkDeleteProblems = async (ids: string[]): Promise<void> => {
  await apiClient.post('/problems/bulk-delete', ids);
};
