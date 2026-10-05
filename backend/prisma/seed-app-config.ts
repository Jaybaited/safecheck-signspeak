// backend/prisma/seed-app-config.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Row = { key: string; value: string; label: string; group: string; sortOrder: number };

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const ROWS: Row[] = [
  { key: 'role_admin',   value: 'ADMIN',   label: 'Admin',   group: 'roles', sortOrder: 1 },
  { key: 'role_teacher', value: 'TEACHER', label: 'Teacher', group: 'roles', sortOrder: 2 },
  { key: 'role_parent',  value: 'PARENT',  label: 'Parent',  group: 'roles', sortOrder: 3 },
  { key: 'role_student', value: 'STUDENT', label: 'Student', group: 'roles', sortOrder: 4 },

  ...GRADES.map((n) => ({
    key: `grade_${n}`, value: `GRADE_${n}`, label: `Grade ${n}`, group: 'grade_levels', sortOrder: n,
  })),

  { key: 'attendance_present',         value: 'PRESENT',         label: 'Present',         group: 'attendance_statuses', sortOrder: 1 },
  { key: 'attendance_late',            value: 'LATE',            label: 'Late',            group: 'attendance_statuses', sortOrder: 2 },
  { key: 'attendance_absent',          value: 'ABSENT',          label: 'Absent',          group: 'attendance_statuses', sortOrder: 3 },
  { key: 'attendance_unconfirmed_out', value: 'UNCONFIRMED_OUT', label: 'Unconfirmed Out', group: 'attendance_statuses', sortOrder: 4 },

  { key: 'fsl_alphabet',  value: 'ALPHABET',  label: 'Alphabet',  group: 'fsl_categories', sortOrder: 1 },
  { key: 'fsl_numbers',   value: 'NUMBERS',   label: 'Numbers',   group: 'fsl_categories', sortOrder: 2 },
  { key: 'fsl_greetings', value: 'GREETINGS', label: 'Greetings', group: 'fsl_categories', sortOrder: 3 },
  { key: 'fsl_family',    value: 'FAMILY',    label: 'Family',    group: 'fsl_categories', sortOrder: 4 },
  { key: 'fsl_actions',   value: 'ACTIONS',   label: 'Actions',   group: 'fsl_categories', sortOrder: 5 },
  { key: 'fsl_objects',   value: 'OBJECTS',   label: 'Objects',   group: 'fsl_categories', sortOrder: 6 },
  { key: 'fsl_colors',    value: 'COLORS',    label: 'Colors',    group: 'fsl_categories', sortOrder: 7 },
  { key: 'fsl_phrases',   value: 'PHRASES',   label: 'Phrases',   group: 'fsl_categories', sortOrder: 8 },

  { key: 'assessment_type_cognitive',   value: 'COGNITIVE',              label: 'Cognitive',              group: 'assessment_types', sortOrder: 1 },
  { key: 'assessment_type_gesture',     value: 'GESTURE_IDENTIFICATION', label: 'Gesture Identification', group: 'assessment_types', sortOrder: 2 },
  { key: 'assessment_type_fill_blank',  value: 'FILL_IN_THE_BLANK',      label: 'Fill in the Blank',      group: 'assessment_types', sortOrder: 3 },
  { key: 'assessment_type_storybook',   value: 'STORYBOOK',              label: 'Storybook',              group: 'assessment_types', sortOrder: 4 },

  { key: 'assessment_level_1', value: '1', label: 'Level 1 - Basic',        group: 'assessment_levels', sortOrder: 1 },
  { key: 'assessment_level_2', value: '2', label: 'Level 2 - Intermediate', group: 'assessment_levels', sortOrder: 2 },
  { key: 'assessment_level_3', value: '3', label: 'Level 3 - Advanced',     group: 'assessment_levels', sortOrder: 3 },
];

async function main() {
  for (const r of ROWS) {
    await prisma.appConfig.upsert({
      where: { key: r.key },
      update: {},
      create: r,
    });
  }
  const total = await prisma.appConfig.count();
  console.log(`App config seed complete. Rows in app_config: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });