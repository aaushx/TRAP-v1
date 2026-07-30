import React, { useEffect, useState } from 'react';
import { X, Building2, Briefcase, Calendar, Link as LinkIcon, DollarSign, FileText } from 'lucide-react';
import { Company, CompanyCreate } from '@/services/api/company';
import { useToastStore } from '@/store/toast.store';
import { motion } from 'framer-motion';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (company: CompanyCreate | Company) => void;
  companyToEdit?: Company;
}

const initialFormState: CompanyCreate = {
  name: '',
  role: '',
  status: 'wishlist',
  appliedDate: '',
  interviewDate: '',
  jobUrl: '',
  salaryRange: '',
  notes: '',
};

export const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onSubmit, companyToEdit }) => {
  const { addToast } = useToastStore();
  const [formData, setFormData] = useState<CompanyCreate | Company>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyToEdit) {
      setFormData(companyToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      addToast('Company name and role are required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      addToast(companyToEdit ? 'Company updated successfully!' : 'Company added successfully!', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to save company', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all text-sm";
  const labelClasses = "block text-sm font-medium text-text-secondary mb-1";

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
      
      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-bg-surface rounded-2xl border border-border-default shadow-glow-lg overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default bg-white/[0.02]">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />
            {companyToEdit ? 'Edit Company' : 'Add Company'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className={labelClasses}>Company Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10`}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className={labelClasses}>Role *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10`}
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={labelClasses}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Salary Range */}
              <div>
                <label className={labelClasses}>Salary Range</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    name="salaryRange"
                    value={formData.salaryRange || ''}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10`}
                    placeholder="e.g. $120k - $150k"
                  />
                </div>
              </div>

              {/* Applied Date */}
              <div>
                <label className={labelClasses}>Applied Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="date"
                    name="appliedDate"
                    value={formData.appliedDate || ''}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10 [color-scheme:dark]`}
                  />
                </div>
              </div>

              {/* Interview Date */}
              <div>
                <label className={labelClasses}>Interview Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate || ''}
                    onChange={handleChange}
                    className={`${inputClasses} pl-10 [color-scheme:dark]`}
                  />
                </div>
              </div>
            </div>

            {/* Job URL */}
            <div>
              <label className={labelClasses}>Job URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <LinkIcon className="h-4.5 w-4.5" />
                </div>
                <input
                  type="url"
                  name="jobUrl"
                  value={formData.jobUrl || ''}
                  onChange={handleChange}
                  className={`${inputClasses} pl-10`}
                  placeholder="https://..."
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
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputClasses} pl-10 py-3 resize-none`}
                  placeholder="Add any context, interview details, or thoughts here..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default bg-white/[0.01] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="company-form"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-glow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : companyToEdit ? 'Save Changes' : 'Add Company'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
