import { useState, useEffect } from 'react';
import { X, Code2, Layers, Sliders, Layout, Link2, FileText } from 'lucide-react';
import { useProblemStore } from '@/store/problem.store';
import { useToastStore } from '@/store/toast.store';
import { Problem, Platform, Difficulty, Status } from '@/services/api/problem';
import { motion } from 'framer-motion';

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemToEdit?: Problem;
}

export const ProblemModal: React.FC<ProblemModalProps> = ({ isOpen, onClose, problemToEdit }) => {
  const { addProblem, editProblem } = useProblemStore();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    platform: 'leetcode' as Platform,
    topic: '',
    difficulty: 'easy' as Difficulty,
    status: 'attempted' as Status,
    platform_url: '',
    notes: '',
    is_bookmarked: false,
  });

  useEffect(() => {
    if (problemToEdit) {
      setFormData({
        title: problemToEdit.title,
        platform: problemToEdit.platform,
        topic: problemToEdit.topic || '',
        difficulty: problemToEdit.difficulty,
        status: problemToEdit.status,
        platform_url: problemToEdit.platform_url || '',
        notes: problemToEdit.notes || '',
        is_bookmarked: problemToEdit.is_bookmarked,
      });
    } else {
      setFormData({
        title: '',
        platform: 'leetcode',
        topic: '',
        difficulty: 'easy',
        status: 'attempted',
        platform_url: '',
        notes: '',
        is_bookmarked: false,
      });
    }
  }, [problemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Problem title is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (problemToEdit) {
        await editProblem(problemToEdit.id, formData);
        addToast('Problem updated successfully!', 'success');
      } else {
        await addProblem(formData);
        addToast('Problem added successfully!', 'success');
      }
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to save problem', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all text-sm";
  const labelClasses = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-glow-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default bg-white/[0.02]">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-400" />
            {problemToEdit ? 'Edit Problem' : 'Add Problem'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="problem-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title */}
          <div>
            <label className={labelClasses}>Title *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                <Code2 className="h-4.5 w-4.5" />
              </div>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`${inputClasses} pl-10`}
                placeholder="e.g. Two Sum"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Platform */}
            <div>
              <label className={labelClasses}>Platform</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Layout className="h-4.5 w-4.5" />
                </div>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className={`${inputClasses} pl-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em] cursor-pointer`}
                >
                  <option value="leetcode" className="bg-bg-surface">LeetCode</option>
                  <option value="gfg" className="bg-bg-surface">GeeksForGeeks</option>
                  <option value="hackerrank" className="bg-bg-surface">HackerRank</option>
                  <option value="codeforces" className="bg-bg-surface">Codeforces</option>
                  <option value="interviewbit" className="bg-bg-surface">InterviewBit</option>
                  <option value="other" className="bg-bg-surface">Other</option>
                </select>
              </div>
            </div>
            
            {/* Topic */}
            <div>
              <label className={labelClasses}>Topic</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className={`${inputClasses} pl-10`}
                  placeholder="e.g. Arrays, DP"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <label className={labelClasses}>Difficulty</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Sliders className="h-4.5 w-4.5" />
                </div>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className={`${inputClasses} pl-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em] cursor-pointer`}
                >
                  <option value="easy" className="bg-bg-surface">Easy</option>
                  <option value="medium" className="bg-bg-surface">Medium</option>
                  <option value="hard" className="bg-bg-surface">Hard</option>
                </select>
              </div>
            </div>
            
            {/* Status */}
            <div>
              <label className={labelClasses}>Status</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Sliders className="h-4.5 w-4.5" />
                </div>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`${inputClasses} pl-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[length:1em_1em] cursor-pointer`}
                >
                  <option value="attempted" className="bg-bg-surface">Attempted</option>
                  <option value="solved" className="bg-bg-surface">Solved</option>
                  <option value="revisit" className="bg-bg-surface">Revisit</option>
                  <option value="skipped" className="bg-bg-surface">Skipped</option>
                </select>
              </div>
            </div>
          </div>

          {/* Platform URL */}
          <div>
            <label className={labelClasses}>Platform URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                <Link2 className="h-4.5 w-4.5" />
              </div>
              <input
                type="url"
                name="platform_url"
                value={formData.platform_url}
                onChange={handleChange}
                className={`${inputClasses} pl-10`}
                placeholder="https://leetcode.com/problems/..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClasses}>Notes</label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-text-tertiary">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className={`${inputClasses} pl-10 py-2.5 resize-none`}
                placeholder="Write any hints, solutions, or key patterns..."
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex justify-end gap-3 bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="problem-form"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 shadow-glow-sm cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : problemToEdit ? 'Save Changes' : 'Add Problem'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
