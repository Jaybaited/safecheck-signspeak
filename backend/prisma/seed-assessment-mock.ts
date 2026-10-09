// backend/prisma/seed-assessment-mock.ts  (MOCK content for the demo; faculty will supply the real questions)
import { PrismaClient, AssessmentAudience, AssessmentType, QuestionType, Role } from '@prisma/client';

const prisma = new PrismaClient();

type Q = { choices: Record<string, string>; correct: 'A' | 'B' | 'C' | 'D' };

const LEVEL1: Q[] = [
  { choices: { A: 'Mother', B: 'Father', C: 'Food', D: 'Water' }, correct: 'A' },
  { choices: { A: 'Water', B: 'Father', C: 'Help', D: 'Stop' }, correct: 'B' },
  { choices: { A: 'Please', B: 'Sorry', C: 'Food', D: 'Teacher' }, correct: 'C' },
  { choices: { A: 'Student', B: 'Help', C: 'Stop', D: 'Water' }, correct: 'D' },
  { choices: { A: 'Thank you', B: 'Sorry', C: 'Please', D: 'Hello' }, correct: 'A' },
  { choices: { A: 'Stop', B: 'Please', C: 'Done', D: 'Help' }, correct: 'B' },
  { choices: { A: 'Hello', B: 'Mother', C: 'Sorry', D: 'Father' }, correct: 'C' },
  { choices: { A: 'Teacher', B: 'Student', C: 'Water', D: 'Hello' }, correct: 'D' },
  { choices: { A: 'Teacher', B: 'Food', C: 'Help', D: 'Stop' }, correct: 'A' },
  { choices: { A: 'Done', B: 'Help', C: 'Student', D: 'Please' }, correct: 'B' },
];

const LEVEL2: Q[] = [
  { choices: { A: 'Student', B: 'Teacher', C: 'Mother', D: 'Help' }, correct: 'A' },
  { choices: { A: 'Done', B: 'Stop', C: 'Please', D: 'Water' }, correct: 'B' },
  { choices: { A: 'Sorry', B: 'Food', C: 'Done / Finished', D: 'Hello' }, correct: 'C' },
  { choices: { A: 'Again / Repeat', B: 'Stop', C: 'Help', D: 'Father' }, correct: 'A' },
  { choices: { A: 'Teacher', B: 'Student', C: 'Water', D: 'Time / When' }, correct: 'D' },
];

async function seedLevel(title: string, level: number, description: string, qs: Q[], adminId: string) {
  const exists = await prisma.assessment.findFirst({ where: { title } });
  if (exists) { console.log(`Skipped (already exists): ${title}`); return; }
  await prisma.assessment.create({
    data: {
      title,
      audience: AssessmentAudience.STUDENT,
      type: AssessmentType.GESTURE_IDENTIFICATION,
      isActive: true,
      isPublished: true,
      level,
      passMark: 70,
      lessonVideoUrl: null,
      lessonDescription: description,
      createdBy: adminId,
      questions: {
        create: qs.map((q, i) => ({
          order: i + 1,
          type: QuestionType.VIDEO_IDENTIFY,
          prompt: `MOCK question ${i + 1}: Which word does the signer show in the video?`,
          mediaUrl: null,
          captionUrl: null,
          choices: q.choices,
          correctAnswer: q.correct,
        })),
      },
    },
  });
  console.log(`Created: ${title} (${qs.length} questions)`);
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) throw new Error('No ADMIN user found to own the mock assessments.');
  await seedLevel('Level 1 - Basic (MOCK)', 1,
    'MOCK lesson. Watch the lesson video, then answer the questions about the signs you saw.', LEVEL1, admin.id);
  await seedLevel('Level 2 - Intermediate (MOCK)', 2,
    'MOCK lesson for Level 2. This level unlocks after you pass Level 1.', LEVEL2, admin.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });