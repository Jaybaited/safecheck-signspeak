import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  id: string;
  role: string;
}

/** Reads the logged-in user that JwtStrategy puts on the request. */
export function getAuthUser(req: any): AuthUser {
  const id   = req?.user?.id ?? req?.user?.sub;
  const role = req?.user?.role;
  if (!id || !role) throw new ForbiddenException('Not authenticated.');
  return { id, role };
}

/**
 * ADMIN and TEACHER: any student.
 * STUDENT: only themselves.
 * PARENT: only a child linked to them.
 */
export async function assertCanAccessStudent(
  prisma: PrismaService,
  user: AuthUser,
  studentId: string,
): Promise<void> {
  if (user.role === 'ADMIN' || user.role === 'TEACHER') return;
  if (user.role === 'STUDENT' && user.id === studentId) return;

  if (user.role === 'PARENT') {
    const link = await prisma.parentStudent.findFirst({
      where:  { parentId: user.id, studentId },
      select: { parentId: true },
    });
    if (link) return;
  }

  throw new ForbiddenException('You do not have access to this student.');
}