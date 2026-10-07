// backend/prisma/set-lesson-videos.ts - points the lesson videos at the school's YouTube videos.
// Run from the backend folder: npx ts-node prisma/set-lesson-videos.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UPDATES = [
  {
    title: 'Level 1 - Basic (MOCK)',
    url: 'https://www.youtube.com/watch?v=_7XkZhehnuc',
    description: 'Lesson: Action Words, from the Philippine School for the Deaf. Watch the video, then answer the practice questions (the questions are still mock content).',
  },
  {
    title: 'Level 2 - Intermediate (MOCK)',
    url: 'https://www.youtube.com/watch?v=Xe5N2VKakVE',
    description: 'Lesson: Transportation, from the Philippine School for the Deaf. This level unlocks after you pass Level 1 (the questions are still mock content).',
  },
];

async function main() {
  for (const u of UPDATES) {
    const res = await prisma.assessment.updateMany({
      where: { title: u.title },
      data: { lessonVideoUrl: u.url, lessonDescription: u.description },
    });
    console.log(u.title + ': updated ' + res.count);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });