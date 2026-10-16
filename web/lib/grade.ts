// web/lib/grade.ts
// One place for the grade list and the grade labels.

export const ALL_GRADES = [
  'KINDERGARTEN',
  'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
  'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12',
] as const;

export type GradeValue = (typeof ALL_GRADES)[number];

/** "KINDERGARTEN" -> "Kindergarten", "GRADE_7" -> "Grade 7". */
export function gradeText(g: string): string {
  if (g === 'KINDERGARTEN') return 'Kindergarten';
  return g.replace('GRADE_', 'Grade ');
}

/** Short label for small chips: "Kinder" or "Gr. 7". */
export function gradeShort(g: string): string {
  if (g === 'KINDERGARTEN') return 'Kinder';
  return g.replace('GRADE_', 'Gr. ');
}