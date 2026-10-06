// backend/prisma/reset-demo.ts - removes ONLY accounts whose username starts with "demo_".
// Cascade rules remove their attendance, FSL progress, game scores, parent links, and attempts.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { username: { startsWith: 'demo_' } },
    select: { username: true },
  });
  const res = await prisma.user.deleteMany({ where: { username: { startsWith: 'demo_' } } });
  console.log('Deleted ' + res.count + ' demo accounts: ' + (users.map((u) => u.username).join(', ') || '(none)'));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });