// backend/prisma/seed-demo.ts - MOCK demo data. Every account starts with "demo_".
// Run: $env:DEMO_PASSWORD = "..."; npx ts-node prisma/seed-demo.ts   (re-running refreshes the dates)
import {
  Prisma, PrismaClient, Role, GradeLevel, AttendanceStatus, AttemptStatus,
  FSLActivitySource, FSLCategory, FSLProgressStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Profile = {
  username: string; firstName: string; grade: GradeLevel;
  mastered: number; pAbsent: number; pLate: number;
};

const STUDENTS: Profile[] = [
  { username: 'demo_student1', firstName: 'Ana',   grade: GradeLevel.GRADE_7,  mastered: 24, pAbsent: 0.03, pLate: 0.05 },
  { username: 'demo_student2', firstName: 'Ben',   grade: GradeLevel.GRADE_8,  mastered: 15, pAbsent: 0.10, pLate: 0.20 },
  { username: 'demo_student3', firstName: 'Carla', grade: GradeLevel.GRADE_9,  mastered: 8,  pAbsent: 0.15, pLate: 0.25 },
  { username: 'demo_student4', firstName: 'Dan',   grade: GradeLevel.GRADE_10, mastered: 20, pAbsent: 0.05, pLate: 0.10 },
  { username: 'demo_student5', firstName: 'Ella',  grade: GradeLevel.GRADE_11, mastered: 3,  pAbsent: 0.25, pLate: 0.30 },
  { username: 'demo_student6', firstName: 'Faye',  grade: GradeLevel.GRADE_12, mastered: 0,  pAbsent: 0.40, pLate: 0.30 },
];

const PARENTS = [
  { username: 'demo_parent1', firstName: 'Maria', children: ['demo_student1', 'demo_student2'] },
  { username: 'demo_parent2', firstName: 'Jose',  children: ['demo_student3'] },
  { username: 'demo_parent3', firstName: 'Lena',  children: ['demo_student4', 'demo_student5'] },
];

async function removeDemo() {
  const res = await prisma.user.deleteMany({ where: { username: { startsWith: 'demo_' } } });
  console.log('Removed ' + res.count + ' old demo accounts');
}

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Set DEMO_PASSWORD first (8+ characters). It is not stored anywhere.');
  }
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) throw new Error('No ADMIN user found.');

  await removeDemo();
  const hash = await bcrypt.hash(password, 10);

  // Manila "today" as the app stores it (UTC midnight of the Manila date)
  const nowMs = Date.now();
  const manila = new Date(nowMs + 8 * HOUR);
  const todayMs = Date.UTC(manila.getUTCFullYear(), manila.getUTCMonth(), manila.getUTCDate());

  const weekdays: number[] = [];
  for (let t = todayMs - DAY; weekdays.length < 10; t -= DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) weekdays.push(t);
  }
  weekdays.reverse();

  const letters = await prisma.fSLWord.findMany({
    where: { category: FSLCategory.ALPHABET, isDynamic: false },
    orderBy: { word: 'asc' },
  });

  const ids: Record<string, string> = {};

  for (const p of STUDENTS) {
    const u = await prisma.user.create({
      data: {
        username: p.username, password: hash, role: Role.STUDENT,
        firstName: p.firstName, lastName: 'Demo', gradeLevel: p.grade,
        mustChangePassword: false,
      },
    });
    ids[p.username] = u.id;
  }
  for (const p of PARENTS) {
    const u = await prisma.user.create({
      data: {
        username: p.username, password: hash, role: Role.PARENT,
        firstName: p.firstName, lastName: 'Demo', mustChangePassword: false,
      },
    });
    ids[p.username] = u.id;
    for (const child of p.children) {
      await prisma.parentStudent.create({ data: { parentId: u.id, studentId: ids[child] } });
    }
  }

  let attendanceRows = 0;
  let activityRows = 0;
  let scoreRows = 0;

  for (let idx = 0; idx < STUDENTS.length; idx++) {
    const p = STUDENTS[idx];
    const studentId = ids[p.username];
    const rand = rng(1000 + idx * 77);

    // ---- attendance: last 10 weekdays, nothing for today ----
    const rows: Prisma.AttendanceCreateManyInput[] = [];
    for (const dateMs of weekdays) {
      const r = rand();
      if (r < p.pAbsent) continue;
      const late = r < p.pAbsent + p.pLate;
      const inMin = late ? 8 * 60 + 5 + Math.floor(rand() * 40) : 7 * 60 + 20 + Math.floor(rand() * 38);
      const outMin = 16 * 60 + 10 + Math.floor(rand() * 50);
      const noOut = rand() < 0.08;
      const base = dateMs - 8 * HOUR;
      rows.push({
        studentId,
        date: new Date(dateMs),
        timeIn: new Date(base + inMin * MIN),
        timeOut: noOut ? null : new Date(base + outMin * MIN),
        status: late ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        noTapOut: !!noOut,
      });
    }
    await prisma.attendance.createMany({ data: rows });
    attendanceRows += rows.length;

    // ---- FSL progress ----
    const masteredLetters = letters.slice(0, p.mastered);
    const inProgressLetters = p.mastered > 0 || idx === 4 ? letters.slice(p.mastered, p.mastered + 2) : [];
    const progressRows = [
      ...masteredLetters.map((l) => ({
        studentId, wordId: l.id, status: FSLProgressStatus.MASTERED,
        attempts: 1 + Math.floor(rand() * 5), accuracy: 0.78 + rand() * 0.18,
        lastPracticed: new Date(nowMs - Math.floor(rand() * 6 * DAY)),
      })),
      ...inProgressLetters.map((l) => ({
        studentId, wordId: l.id, status: FSLProgressStatus.IN_PROGRESS,
        attempts: 1 + Math.floor(rand() * 3), accuracy: 0.5 + rand() * 0.2,
        lastPracticed: new Date(nowMs - Math.floor(rand() * 3 * DAY)),
      })),
    ];
    if (progressRows.length) await prisma.fSLProgress.createMany({ data: progressRows });

    // ---- FSL activity (last 7 days, including today in the past) ----
    const pool = [...masteredLetters, ...inProgressLetters];
    const activity: Prisma.FSLActivityCreateManyInput[] = [];
    if (pool.length) {
      for (let k = 0; k < 7; k++) {
        const count = Math.floor(rand() * (p.mastered >= 15 ? 7 : 4));
        for (let n = 0; n < count; n++) {
          const ago = k === 0 ? (1 + rand() * 5) * HOUR : k * DAY + rand() * 6 * HOUR;
          activity.push({
            studentId,
            wordId: pool[Math.floor(rand() * pool.length)].id,
            source: rand() < 0.3 ? FSLActivitySource.GAME : FSLActivitySource.PRACTICE,
            confidence: 0.75 + rand() * 0.22,
            createdAt: new Date(nowMs - ago),
          });
        }
      }
      if (activity.length) await prisma.fSLActivity.createMany({ data: activity });
    }
    activityRows += activity.length;

    // ---- game scores ----
    if (p.mastered >= 8) {
      const games: Prisma.FSLGameScoreCreateManyInput[] = [];
      const total = 2 + Math.floor(rand() * 2);
      for (let g = 0; g < total; g++) {
        games.push({
          studentId,
          mode: rand() < 0.5 ? 'SPEED' : 'STREAK',
          score: 300 + Math.floor(rand() * 900),
          lettersCount: 4 + Math.floor(rand() * 9),
          createdAt: new Date(nowMs - Math.floor(rand() * 5 * DAY)),
        });
      }
      await prisma.fSLGameScore.createMany({ data: games });
      scoreRows += games.length;
    }
  }

  // ---- assessment attempts (Level 1 MOCK must already exist) ----
  const level1 = await prisma.assessment.findFirst({
    where: { title: 'Level 1 - Basic (MOCK)' },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!level1 || level1.questions.length === 0) {
    console.log('Skipped attempts: "Level 1 - Basic (MOCK)" not found (run seed-assessment-mock.ts first).');
  } else {
    const plans = [
      { user: 'demo_student1', correct: 9, reviewed: true,  daysAgo: 4 },
      { user: 'demo_student2', correct: 6, reviewed: false, daysAgo: 1 },
      { user: 'demo_student3', correct: 4, reviewed: true,  daysAgo: 3 },
    ];
    for (const plan of plans) {
      const total = level1.questions.length;
      const score = Math.round((plan.correct / total) * 100);
      const submittedAt = new Date(nowMs - plan.daysAgo * DAY);
      await prisma.assessmentAttempt.create({
        data: {
          assessmentId: level1.id,
          userId: ids[plan.user],
          status: plan.reviewed ? AttemptStatus.GRADED : AttemptStatus.SUBMITTED,
          score,
          passed: plan.reviewed ? score >= level1.passMark : null,
          scoreVisibleToUser: plan.reviewed,
          reviewedByAdminId: plan.reviewed ? admin.id : null,
          reviewedAt: plan.reviewed ? new Date(submittedAt.getTime() + 2 * HOUR) : null,
          startedAt: new Date(submittedAt.getTime() - 12 * MIN),
          submittedAt,
          responses: {
            create: level1.questions.map((q, i) => {
              const right = i < plan.correct;
              const correct = q.correctAnswer ?? 'A';
              const wrong = ['A', 'B', 'C', 'D'].find((c) => c !== correct) ?? 'B';
              return {
                questionId: q.id,
                submittedSign: right ? correct : wrong,
                isCorrect: right,
                answeredAt: new Date(submittedAt.getTime() - (total - i) * MIN),
              };
            }),
          },
        },
      });
    }
    console.log('Created 3 Level 1 attempts (1 passed, 1 waiting for review, 1 failed)');
  }

  console.log('Created ' + STUDENTS.length + ' demo students and ' + PARENTS.length + ' demo parents');
  console.log('Attendance rows: ' + attendanceRows + ', FSL activity rows: ' + activityRows + ', game scores: ' + scoreRows);
  console.log('Log in with any username starting with demo_ and the password you set.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });