import React from 'react';
import { Company } from '@/services/api/company';

interface CompanyStatusBadgeProps {
  status: Company['status'];
}

export const CompanyStatusBadge: React.FC<CompanyStatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<Company['status'], { bg: string; text: string; label: string }> = {
    wishlist: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Wishlist' },
    applied: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Applied' },
    interviewing: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Interviewing' },
    offered: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Offered' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  };

  const style = statusStyles[status] || statusStyles.wishlist;

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};
