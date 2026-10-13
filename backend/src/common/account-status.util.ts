import { PrismaService } from '../prisma/prisma.service';

/** Returns a message when the account may not use the system, or null when it is fine. */
export async function getAccountBlock(
  prisma: PrismaService,
  user: { id: string; role: string; archivedAt: Date | null },
): Promise<string | null> {
  if (user.archivedAt) {
    return 'This account has been archived. Please contact the school.';
  }
  if (user.role === 'PARENT') {
    const total = await prisma.parentStudent.count({ where: { parentId: user.id } });
    if (total > 0) {
      const active = await prisma.parentStudent.count({
        where: { parentId: user.id, student: { archivedAt: null } },
      });
      if (active === 0) {
        return 'This parent account is inactive because all linked students have been archived. Please contact the school.';
      }
    }
  }
  return null;
}