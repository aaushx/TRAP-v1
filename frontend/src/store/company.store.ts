import { create } from 'zustand';
import { Company, CompanyCreate, CompanyUpdate, CompanyQueryParams, companyApi } from '@/services/api/company';

interface CompanyState {
  companies: Company[];
  isLoading: boolean;
  error: string | null;

  fetchCompanies: (params?: CompanyQueryParams) => Promise<void>;
  addCompany: (company: CompanyCreate) => Promise<void>;
  editCompany: (id: string, company: CompanyUpdate) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  removeCompaniesBulk: (ids: string[]) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  isLoading: false,
  error: null,

  fetchCompanies: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const companies = await companyApi.getCompanies(params);
      set({ companies, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Failed to fetch companies',
        isLoading: false 
      });
      throw error;
    }
  },

  addCompany: async (companyCreate) => {
    set({ isLoading: true, error: null });
    try {
      const newCompany = await companyApi.createCompany(companyCreate);
      set((state) => ({ 
        companies: [...state.companies, newCompany],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Failed to add company',
        isLoading: false 
      });
      throw error;
    }
  },

  editCompany: async (id, companyUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCompany = await companyApi.updateCompany(id, companyUpdate);
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updatedCompany : c)),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Failed to update company',
        isLoading: false 
      });
      throw error;
    }
  },

  removeCompany: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await companyApi.deleteCompany(id);
      set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Failed to delete company',
        isLoading: false 
      });
      throw error;
    }
  },

  removeCompaniesBulk: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      await companyApi.bulkDeleteCompanies(ids);
      set((state) => ({
        companies: state.companies.filter((c) => !ids.includes(c.id)),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || error.message || 'Failed to delete selected companies',
        isLoading: false 
      });
      throw error;
    }
  }
}));
