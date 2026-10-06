// backend/prisma/dev-reset-attempts.ts
// DEV ONLY: deletes all assessment attempts of one user so the demo can be repeated.
// Usage: npx ts-node prisma/dev-reset-attempts.ts <username>
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  if (!username) throw new Error('Usage: npx ts-node prisma/dev-reset-attempts.ts <username>');
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`No user with username "${username}"`);
  const res = await prisma.assessmentAttempt.deleteMany({ where: { userId: user.id } });
  console.log(`Deleted ${res.count} attempt(s) for ${username}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });