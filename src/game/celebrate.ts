import type { GradeId } from '../config/constants';

/** Dynasty and Perfection are the grades worth a celebration. */
export function shouldCelebrate(gradeId: GradeId): boolean {
  return gradeId === 'dynasty' || gradeId === 'perfection';
}
