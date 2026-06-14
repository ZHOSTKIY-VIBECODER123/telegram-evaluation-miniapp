// Справочник ролей сотрудников. Первая роль — административная.
export const ROLES = [
  "Руководитель отдела по привлечению и Бизнес Поддержки",
  "Руководитель отдела по привлечению",
  "Team Leader",
  "Менеджер по привлечению партнеров",
] as const;

export type Role = (typeof ROLES)[number];

// Только эта роль может: менять роли сотрудников, удалять сотрудников,
// редактировать чек-листы.
export const ADMIN_ROLE: Role = ROLES[0];

// Иерархия оценки: кто какие роли может оценивать.
// Админ-роль оценивает всех (обрабатывается отдельно в canEvaluateRole).
const EVALUATION_MATRIX: Record<string, string[]> = {
  "Руководитель отдела по привлечению": ["Team Leader"],
  "Team Leader": ["Менеджер по привлечению партнеров"],
};

/** Может ли сотрудник с ролью evaluatorRole оценивать сотрудника с ролью targetRole. */
export function canEvaluateRole(evaluatorRole: string, targetRole: string): boolean {
  if (evaluatorRole === ADMIN_ROLE) return true; // оценивает всех
  return (EVALUATION_MATRIX[evaluatorRole] ?? []).includes(targetRole);
}

/** Оценивает ли данная роль кого-либо вообще. */
export function canEvaluateAnyone(role: string): boolean {
  return role === ADMIN_ROLE || (EVALUATION_MATRIX[role]?.length ?? 0) > 0;
}
