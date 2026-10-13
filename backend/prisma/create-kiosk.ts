// Creates (or resets) the kiosk account used by the gate computer.
// Run through the PowerShell helper that asks for the password with a hidden prompt.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = (process.env.KIOSK_USERNAME ?? 'kiosk').trim();
  const password = process.env.KIOSK_PASSWORD ?? '';

  if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
    throw new Error('The username must be 3 to 30 letters, numbers, dots, dashes, or underscores.');
  }
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('The password must be at least 12 characters with an uppercase letter, a lowercase letter, and a number.');
  }

  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.role !== 'KIOSK') {
    throw new Error('That username belongs to a non-kiosk account. Choose another username.');
  }

  if (existing) {
    await prisma.user.update({ where: { username }, data: { password: hash, mustChangePassword: false } });
    await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
    console.log('Kiosk account "' + username + '" updated: new password set and old sessions ended.');
  } else {
    await prisma.user.create({
      data: { username, password: hash, role: 'KIOSK', firstName: 'Gate', lastName: 'Kiosk', mustChangePassword: false },
    });
    console.log('Kiosk account "' + username + '" created.');
  }
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });