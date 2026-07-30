

import { FC } from 'react';

type Status = 'solved' | 'revisit' | 'attempted' | 'skipped';

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<Status, string> = {
    solved: 'bg-green-500/10 text-green-500 border border-green-500/20',
    revisit: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    attempted: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    skipped: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };

  const statusLabels: Record<Status, string> = {
    solved: 'Solved',
    revisit: 'Revisit',
    attempted: 'Attempted',
    skipped: 'Skipped',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
};
