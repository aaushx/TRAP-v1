import { apiClient } from '@/services/api/client';

export interface Company {
  id: string;
  name: string;
  role: string;
  status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  appliedDate?: string;
  interviewDate?: string;
  jobUrl?: string;
  salaryRange?: string;
  notes?: string;
  industry?: string;
  tierCategory?: string;
  difficulty?: string;
  preparationTopics?: string[];
  sourceMetadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDirectoryItem {
  rank: number;
  name: string;
  normalized_key: string;
  aliases: string[];
  industry?: string;
  tier_category?: string;
  score: number;
  in_both_datasets: boolean;
  questions_dataset_1: number;
  questions_dataset_2: number;
  total_problem_references: number;
  overall_difficulty: string;
  difficulty_breakdown: Record<string, number>;
  top_preparation_topics: string[];
  hiring_recency_windows: string[];
  hiring_frequency: string;
  job_roles: string[];
  salary_range?: string | null;
  interview_rounds?: string | null;
  sources: string[];
}

export type CompanyCreate = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;
export type CompanyUpdate = Partial<CompanyCreate>;

export interface CompanyQueryParams {
  search?: string;
  status?: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  role?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

export const companyApi = {
  getCompanies: async (params?: CompanyQueryParams): Promise<Company[]> => {
    const { data } = await apiClient.get('/companies', { params });
    return data?.data ?? data;
  },

  getCompany: async (id: string): Promise<Company> => {
    const { data } = await apiClient.get(`/companies/${id}`);
    return data?.data ?? data;
  },

  getDirectory: async (search?: string): Promise<CompanyDirectoryItem[]> => {
    const { data } = await apiClient.get('/companies/directory', { params: { search } });
    return data?.data ?? data;
  },

  createCompany: async (company: CompanyCreate): Promise<Company> => {
    const { data } = await apiClient.post('/companies', company);
    return data?.data ?? data;
  },

  updateCompany: async (id: string, company: CompanyUpdate): Promise<Company> => {
    const { data } = await apiClient.put(`/companies/${id}`, company);
    return data?.data ?? data;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },

  bulkDeleteCompanies: async (ids: string[]): Promise<void> => {
    await apiClient.post('/companies/bulk-delete', ids);
  },
};
