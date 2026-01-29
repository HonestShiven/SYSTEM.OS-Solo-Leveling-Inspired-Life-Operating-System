
/**
 * Calculates the derived Skill Protocol level
 * based solely on completed protocol executions.
 * This function is pure and has no side effects.
 */
export function calculateSkillProtocolLevel(executions: number): number {
  if (executions < 5) return 0;
  if (executions < 15) return 1;
  if (executions < 30) return 2;
  if (executions < 60) return 3;

  // After 60 executions: +1 level every 30 executions
  return 4 + Math.floor((executions - 60) / 30);
}
