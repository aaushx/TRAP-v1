/**
 * Application-wide constants.
 * This is the single source of truth for all dropdown options and enum values.
 * Never hardcode these values inside components or form schemas.
 */

// ── Problem Topics ─────────────────────────────────────────────
export const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Trees',
  'Binary Search Trees',
  'Graphs',
  'Dynamic Programming',
  'Recursion',
  'Backtracking',
  'Greedy',
  'Divide and Conquer',
  'Sorting',
  'Searching',
  'Hashing',
  'Heaps',
  'Tries',
  'Segment Trees',
  'Binary Indexed Trees (BIT)',
  'Bit Manipulation',
  'Math',
  'Two Pointers',
  'Sliding Window',
  'Intervals',
  'Matrix',
  'Design',
  'System Design',
  'OS Concepts',
  'DBMS Concepts',
  'CN Concepts',
  'OOP Concepts',
] as const

export type Topic = (typeof TOPICS)[number]

// ── Problem Platforms ──────────────────────────────────────────
export const PLATFORMS = [
  'leetcode',
  'gfg',
  'codeforces',
  'hackerrank',
  'interviewbit',
  'codechef',
  'other',
] as const

export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_LABELS: Record<Platform, string> = {
  leetcode:    'LeetCode',
  gfg:         'GeeksforGeeks',
  codeforces:  'Codeforces',
  hackerrank:  'HackerRank',
  interviewbit:'InterviewBit',
  codechef:    'CodeChef',
  other:       'Other',
}

// ── Difficulty Levels ──────────────────────────────────────────
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

// ── Problem Status ─────────────────────────────────────────────
export const PROBLEM_STATUSES = ['solved', 'revisit', 'attempted', 'skipped'] as const
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number]

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  solved:    'Solved',
  revisit:   'Revisit',
  attempted: 'Attempted',
  skipped:   'Skipped',
}

// ── Company Stages ─────────────────────────────────────────────
export const COMPANY_STAGES = [
  'wishlist',
  'applied',
  'oa',
  'interview',
  'offer',
  'rejected',
] as const

export type CompanyStage = (typeof COMPANY_STAGES)[number]

export const COMPANY_STAGE_LABELS: Record<CompanyStage, string> = {
  wishlist:  'Wishlist',
  applied:   'Applied',
  oa:        'OA',
  interview: 'Interview',
  offer:     'Offer',
  rejected:  'Rejected',
}

// ── Goal Types ─────────────────────────────────────────────────
export const GOAL_TYPES = [
  'solve_problems',
  'revise_topic',
  'apply_company',
  'complete_resource',
  'custom',
] as const

export type GoalType = (typeof GOAL_TYPES)[number]

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  solve_problems:    'Solve Problems',
  revise_topic:      'Revise Topic',
  apply_company:     'Apply to Company',
  complete_resource: 'Complete Resource',
  custom:            'Custom Goal',
}

// ── Skill Levels ───────────────────────────────────────────────
export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

// ── Theme Options ──────────────────────────────────────────────
export const THEMES = ['dark', 'light', 'system'] as const
export type Theme = (typeof THEMES)[number]

// ── Pagination ─────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ── Date Filters ───────────────────────────────────────────────
export const DATE_RANGES = ['7d', '30d', '90d', '365d'] as const
export type DateRange = (typeof DATE_RANGES)[number]

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d':   'Last 7 days',
  '30d':  'Last 30 days',
  '90d':  'Last 90 days',
  '365d': 'Last year',
}
