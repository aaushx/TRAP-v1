

import { FC } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const difficultyStyles: Record<Difficulty, string> = {
    easy: 'bg-green-500/10 text-green-500 border border-green-500/20',
    medium: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    hard: 'bg-red-500/10 text-red-500 border border-red-500/20',
  };

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${difficultyStyles[difficulty]}`}>
      {difficultyLabels[difficulty]}
    </span>
  );
};
