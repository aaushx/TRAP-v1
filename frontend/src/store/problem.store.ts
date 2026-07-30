import { create } from 'zustand';
import {
  Problem,
  ProblemCreate,
  ProblemUpdate,
  ProblemQueryParams,
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  bulkDeleteProblems,
} from '@/services/api/problem';

interface ProblemState {
  problems: Problem[];
  isLoading: boolean;
  error: string | null;
  fetchProblems: (params?: ProblemQueryParams) => Promise<void>;
  addProblem: (problem: ProblemCreate) => Promise<void>;
  editProblem: (id: string, problem: ProblemUpdate) => Promise<void>;
  removeProblem: (id: string) => Promise<void>;
  removeProblemsBulk: (ids: string[]) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  problems: [],
  isLoading: false,
  error: null,
  
  fetchProblems: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const problems = await getProblems(params);
      set({ problems, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch problems', 
        isLoading: false 
      });
    }
  },
  
  addProblem: async (problem) => {
    set({ isLoading: true, error: null });
    try {
      const newProblem = await createProblem(problem);
      set((state) => ({
        problems: [newProblem, ...state.problems],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to add problem', 
        isLoading: false 
      });
      throw err;
    }
  },
  
  editProblem: async (id, problem) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProblem = await updateProblem(id, problem);
      set((state) => ({
        problems: state.problems.map((p) => (p.id === id ? updatedProblem : p)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to update problem', 
        isLoading: false 
      });
      throw err;
    }
  },
  
  removeProblem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProblem(id);
      set((state) => ({
        problems: state.problems.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to delete problem', 
        isLoading: false 
      });
      throw err;
    }
  },

  removeProblemsBulk: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      await bulkDeleteProblems(ids);
      set((state) => ({
        problems: state.problems.filter((p) => !ids.includes(p.id)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to delete selected problems', 
        isLoading: false 
      });
      throw err;
    }
  },

  toggleBookmark: async (id) => {
    const problems = get().problems;
    const problem = problems.find(p => p.id === id);
    if (!problem) return;
    const targetState = !problem.is_bookmarked;
    
    // Optimistic update
    set(state => ({
      problems: state.problems.map(p => p.id === id ? { ...p, is_bookmarked: targetState } : p)
    }));

    try {
      await updateProblem(id, { is_bookmarked: targetState });
    } catch (err) {
      // Revert state
      set(state => ({
        problems: state.problems.map(p => p.id === id ? { ...p, is_bookmarked: !targetState } : p)
      }));
      throw err;
    }
  }
}));
