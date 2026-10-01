// backend/prisma/seed-fsl-words.ts
import { PrismaClient, FSLCategory } from '@prisma/client';

const prisma = new PrismaClient();

const STATIC_LETTERS = [
  'A','B','C','D','E','F','G','H','I',
  'K','L','M','N','O','P','Q','R','S',
  'T','U','V','W','X','Y',
];

const DYNAMIC_LETTERS = ['J', 'Z'];

const DYNAMIC_WORDS: { word: string; category: FSLCategory }[] = [
  { word: 'Mother',               category: 'FAMILY' },
  { word: 'Father',               category: 'FAMILY' },
  { word: 'Food',                 category: 'OBJECTS' },
  { word: 'Water',                category: 'OBJECTS' },
  { word: 'Thank you',            category: 'GREETINGS' },
  { word: 'Please',               category: 'GREETINGS' },
  { word: 'Sorry',                category: 'GREETINGS' },
  { word: 'Hello / Good morning', category: 'GREETINGS' },
  { word: 'Time / When',          category: 'PHRASES' },
  { word: 'Teacher',              category: 'PHRASES' },
  { word: 'Student',              category: 'PHRASES' },
  { word: 'Again / Repeat',       category: 'PHRASES' },
  { word: 'Help',                 category: 'PHRASES' },
  { word: 'Stop',                 category: 'PHRASES' },
  { word: 'Done / Finished',      category: 'PHRASES' },
];

async function main() {
  for (const letter of STATIC_LETTERS) {
    await prisma.fSLWord.upsert({
      where: { word: letter },
      update: {},
      create: {
        word: letter,
        category: FSLCategory.ALPHABET,
        isDynamic: false,
        videoUrl: null,
      },
    });
  }

  for (const letter of DYNAMIC_LETTERS) {
    await prisma.fSLWord.upsert({
      where: { word: letter },
      update: {},
      create: {
        word: letter,
        category: FSLCategory.ALPHABET,
        isDynamic: true,
        videoUrl: null,
      },
    });
  }

  for (const entry of DYNAMIC_WORDS) {
    await prisma.fSLWord.upsert({
      where: { word: entry.word },
      update: {},
      create: {
        word: entry.word,
        category: entry.category,
        isDynamic: true,
        videoUrl: null,
      },
    });
  }

  console.log('FSL word seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });