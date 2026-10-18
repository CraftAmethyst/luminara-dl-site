import type { BranchId } from '@/types/releases'

export const BRANCH_ORDER: BranchId[] = ['trials', 'feudalkings']

export const BRANCH_PATHS: Record<BranchId, string> = {
  trials: 'stable/Trials',
  feudalkings: 'stable/FeudalKings',
}
