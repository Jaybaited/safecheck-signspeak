import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ArchiveStudentDto, RestoreStudentDto } from './dto/archive.dto';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminLogService } from '../common/admin-log.service';


@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly adminLog: AdminLogService,
  ) {}


  private generatePassword(): string {
    const crypto = require('crypto') as typeof import('crypto');
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result   = '';
    const bytes  = crypto.randomBytes(10);
    for (let i = 0; i < 10; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }


  private async generateUniquePassword(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = this.generatePassword();
      return code;
    }
    return this.generatePassword();
  }


  private generateUuid(): string {
    const crypto = require('crypto') as typeof import('crypto');
    return crypto.randomUUID();
  }


  // ── Build username with uniqueness retry loop ─────────────────────────────
  private async buildUniqueUsername(lastName: string, rfidCard?: string): Promise<string> {
    const crypto   = require('crypto') as typeof import('crypto');
    const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');


    // If RFID provided, use last-6 of RFID as suffix (still check uniqueness)
    if (rfidCard) {
      const suffix   = rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0');
      const username = `${cleanLast}.${suffix}`;
      const exists   = await this.prisma.user.findUnique({ where: { username } });
      if (!exists) return username;
      // RFID collision extremely rare — fall through to random suffix below
    }


    // Random hex suffix — retry up to 10 times on collision
    for (let attempt = 0; attempt < 10; attempt++) {
      const suffix   = crypto.randomBytes(3).toString('hex'); // 6 hex chars, 16^6 = 16.7M combos
      const username = `${cleanLast}.${suffix}`;
      const exists   = await this.prisma.user.findUnique({ where: { username } });
      if (!exists) return username;
    }


    throw new ConflictException('Could not generate a unique username. Please try again.');
  }


  // ── Build parent username with uniqueness retry ───────────────────────────
  private async buildUniqueParentUsername(rfidCard: string, lastName: string): Promise<string> {
    const crypto  = require('crypto') as typeof import('crypto');
    const suffix  = rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0');
    const primary = `parent.${suffix}`;


    const exists = await this.prisma.user.findUnique({ where: { username: primary } });
    if (!exists) return primary;


    // Fallback: parent.lastName.hexSuffix
    for (let attempt = 0; attempt < 10; attempt++) {
      const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');
      const hex       = crypto.randomBytes(2).toString('hex');
      const username  = `parent.${cleanLast}.${hex}`;
      const ex2       = await this.prisma.user.findUnique({ where: { username } });
      if (!ex2) return username;
    }


    throw new ConflictException('Could not generate a unique parent username. Please try again.');
  }


  async findAll(currentUserId: string) {
    // Archived students, and parents whose students are all archived, stay out of the main list.
    const inactiveParents = {
      role: 'PARENT' as const,
      parentLinks: { some: {} },
      NOT: { parentLinks: { some: { student: { archivedAt: null } } } },
    };
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id:   { not: currentUserId } },
          { role: { not: 'ADMIN' } },
          { role: { not: 'KIOSK' } },
          { archivedAt: null },
          { NOT: inactiveParents },
        ],
      },
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
    });
  }


  async create(createUserDto: CreateUserDto, adminId?: string): Promise<{
    user: Record<string, unknown>;
    generatedPassword: string;
    parentAccount?: { username: string; generatedPassword: string };
  }> {
    const isStudent = createUserDto.role === 'STUDENT';
    if (isStudent && !createUserDto.rfidCard) {
      throw new BadRequestException(
        'Scan the student RFID card first. The card is used for the username and the parent account.',
      );
    }

    const plainPassword  = await this.generateUniquePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const username       = await this.buildUniqueUsername(createUserDto.lastName, createUserDto.rfidCard);
    const userId         = this.generateUuid();

    const needsNewParent = isStudent && !createUserDto.existingParentId;
    const newParentId    = this.generateUuid();
    let newParentUsername = '';
    let newParentPassword = '';
    let newParentHash     = '';
    if (needsNewParent) {
      newParentUsername = await this.buildUniqueParentUsername(
        createUserDto.rfidCard as string,
        createUserDto.lastName,
      );
      newParentPassword = await this.generateUniquePassword();
      newParentHash     = await bcrypt.hash(newParentPassword, 10);
    }

    const insertSql =
      `INSERT INTO users (id, username, email, password, role, "firstName", "lastName", "gradeLevel", "rfidCard", "phoneNumber", "photoUrl", "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8::"GradeLevel", $9, $10, $11, $12, NOW(), NOW())`;

    const result: { parentAccount?: { username: string; generatedPassword: string } } = {};

    try {
      // The student, the parent account and the link are saved together or not at all.
      await this.prisma.$transaction(async (tx) => {
        let parentIdToLink = newParentId;

        if (isStudent && createUserDto.existingParentId) {
          const chosen = await tx.user.findUnique({
            where:  { id: createUserDto.existingParentId },
            select: { id: true, username: true, role: true },
          });
          if (!chosen || chosen.role !== 'PARENT') {
            throw new NotFoundException('The selected parent account was not found. Please choose the parent again.');
          }
          parentIdToLink = chosen.id;
          result.parentAccount = {
            username:          chosen.username,
            generatedPassword: '(existing account - same password)',
          };
        }

        await tx.$executeRawUnsafe(
          insertSql,
          userId,
          username,
          createUserDto.email       || null,
          hashedPassword,
          createUserDto.role,
          createUserDto.firstName,
          createUserDto.lastName,
          createUserDto.gradeLevel  || null,
          createUserDto.rfidCard    || null,
          createUserDto.phoneNumber || null,
          createUserDto.photoUrl    || null,
          true,
        );

        if (needsNewParent) {
          await tx.$executeRawUnsafe(
            insertSql,
            newParentId,
            newParentUsername,
            null,
            newParentHash,
            'PARENT',
            (createUserDto.parentFirstName ?? '').trim() || 'Parent',
            (createUserDto.parentLastName ?? '').trim() || createUserDto.lastName,
            null,
            null,
            createUserDto.phoneNumber || null,
            null,
            true,
          );
          result.parentAccount = { username: newParentUsername, generatedPassword: newParentPassword };
        }

        if (isStudent) {
          await tx.parentStudent.create({ data: { parentId: parentIdToLink, studentId: userId } });
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error creating user:', error);
      const msg: string = (error as any)?.meta?.message ?? (error as any)?.message ?? '';
      if (msg.includes('"rfidCard"'))
        throw new ConflictException('This RFID card is already assigned to another student.');
      if (msg.includes('"username"'))
        throw new ConflictException('This username is already taken. Please choose another.');
      if (msg.includes('"email"'))
        throw new ConflictException('This email is already in use.');
      throw error;
    }

    const createdUser = await this.prisma.user.findFirst({
      where:   { username },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
    });

    await this.adminLog.log(
      adminId,
      'USER_CREATED',
      'USER',
      userId,
      'Created ' + String(createUserDto.role).toLowerCase() + ' account ' + username,
      { role: createUserDto.role, linkedExistingParent: !!createUserDto.existingParentId },
    );

    return {
      user:              createdUser as Record<string, unknown>,
      generatedPassword: plainPassword,
      ...(result.parentAccount ? { parentAccount: result.parentAccount } : {}),
    };
  }

  // NOTE: username and password are intentionally NOT editable here.
  // Passwords change only through change-password / force-change-password
  // or the admin-approved password reset flow.
  async update(id: string, updateData: Partial<CreateUserDto>, changedById?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found.');


    const data: Record<string, unknown> = {};
    if (updateData.email !== undefined)       data.email       = updateData.email;
    if (updateData.firstName)                 data.firstName   = updateData.firstName;
    if (updateData.lastName)                  data.lastName    = updateData.lastName;
    if (updateData.gradeLevel !== undefined)  data.gradeLevel  = updateData.gradeLevel;
    if (updateData.rfidCard !== undefined)    data.rfidCard    = updateData.rfidCard;
    if (updateData.phoneNumber !== undefined) data.phoneNumber = updateData.phoneNumber;
    if (updateData.photoUrl !== undefined)    data.photoUrl    = updateData.photoUrl;


    const roleChanged =
      updateData.role !== undefined && updateData.role !== existing.role;
    if (roleChanged && (existing.role === 'STUDENT' || existing.role === 'PARENT' || updateData.role === 'STUDENT' || updateData.role === 'PARENT')) {
      throw new BadRequestException('Student and parent roles cannot be changed. Create a new account instead.');
    }
    if (updateData.role) data.role = updateData.role;


    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
    });


    if (roleChanged && changedById) {
      await this.prisma.auditLog.create({
        data: {
          userId:    id,
          changedBy: changedById,
          oldRole:   existing.role,
          newRole:   updateData.role as any,
        },
      });
    }


    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const f of ['firstName', 'lastName', 'email', 'gradeLevel', 'rfidCard', 'phoneNumber', 'role'] as const) {
      if (f in data && (data as any)[f] !== (existing as any)[f]) {
        changes[f] = { from: (existing as any)[f] ?? null, to: (data as any)[f] ?? null };
      }
    }
    if (Object.keys(changes).length > 0) {
      await this.adminLog.log(
        changedById,
        changes.rfidCard ? 'RFID_CARD_CHANGED' : changes.role ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
        'USER',
        id,
        'Edited ' + String(existing.role).toLowerCase() + ' account ' + existing.username + ': ' +
          Object.entries(changes).map(([k, v]) => k + ' ' + String(v.from ?? '-') + ' -> ' + String(v.to ?? '-')).join('; '),
        changes,
      );
    }
    return updated;
  }


  async remove(id: string, adminId?: string) {
    const target = await this.prisma.user.findUnique({
      where:  { id },
      select: { id: true, username: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found.');
    if (adminId && target.id === adminId) {
      throw new ForbiddenException('You cannot delete your own account.');
    }

    if (target.role === 'PARENT') {
      const children = await this.prisma.parentStudent.count({ where: { parentId: id } });
      if (children > 0) {
        throw new BadRequestException(
          'A parent account cannot be deleted while it has students. It is removed automatically when its last student is deleted. To remove this family, delete or archive its students.',
        );
      }
    }

    const result = { removedParent: null as string | null };
    try {
      await this.prisma.$transaction(async (tx) => {
        const link = target.role === 'STUDENT'
          ? await tx.parentStudent.findFirst({
              where:  { studentId: id },
              select: { parentId: true, parent: { select: { username: true } } },
            })
          : null;

        await tx.user.delete({ where: { id } });

        // A parent exists only for its students, so it goes with its last student.
        if (link) {
          const left = await tx.parentStudent.count({ where: { parentId: link.parentId } });
          if (left === 0) {
            await tx.user.delete({ where: { id: link.parentId } });
            result.removedParent = link.parent.username;
          }
        }
      });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new ConflictException('This account still owns records (for example assessments it created) and cannot be deleted.');
      }
      throw err;
    }

    await this.adminLog.log(
      adminId,
      'USER_DELETED',
      'USER',
      id,
      'Deleted ' + String(target.role).toLowerCase() + ' account ' + target.username +
        (result.removedParent ? ' and its parent account ' + result.removedParent : ''),
      { role: target.role, removedParent: result.removedParent },
    );
    return { deleted: true, removedParent: result.removedParent };
  }


  async getStats() {
    const [admins, teachers, students, parents] = await Promise.all([
      this.prisma.user.count({ where: { role: 'ADMIN'   } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT', archivedAt: null } }),
      this.prisma.user.count({ where: { role: 'PARENT', NOT: { parentLinks: { some: {} }, NOT: { parentLinks: { some: { student: { archivedAt: null } } } } } } }),
    ]);
    return { admins, teachers, students, parents, total: admins + teachers + students + parents };
  }


  async getStudentParent(studentId: string) {
    const link = await this.prisma.parentStudent.findFirst({
      where:   { studentId },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    return link?.parent ?? null;
  }


  async getMyChildren(parentId: string) {
    const links = await this.prisma.parentStudent.findMany({
      where:   { parentId, student: { archivedAt: null } },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            gradeLevel: true, photoUrl: true, rfidCard: true,
          },
        },
      },
    });
    return links.map((link) => link.student);
  }


  // ── Real-time RFID availability check ─────────────────────────────────────
  async checkRfidAvailable(rfidCard: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findFirst({
      where: { rfidCard },
    });
    return { available: !existing };
  }


  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');


    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect.');


    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { password: hashed, mustChangePassword: false },
    });
    return { message: 'Password changed successfully.' };
  }


  // Only allowed while the account is flagged mustChangePassword (first login
  // or after an admin-approved reset). Ownership is checked in the controller.
  async forceChangePassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { mustChangePassword: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    if (!user.mustChangePassword) {
      throw new ForbiddenException(
        'A password change is not required for this account. Use Change Password in your profile.',
      );
    }


    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { password: hashed, mustChangePassword: false },
    });
    return { message: 'Password changed successfully.' };
  }


  async notifyParentsOfPasswordChange(userId: string, how: 'RESET' | 'CHANGED'): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'STUDENT') {
      await this.notificationsService.notifyParentsPasswordChanged(userId, how);
    }
  }

  async searchParents(q?: string, by?: string) {
    const term = (q ?? '').trim();
    if (term.length < 2) return [];

    const contains = { contains: term, mode: 'insensitive' as const };
    const exact    = { equals: term, mode: 'insensitive' as const };
    const matches = await this.prisma.parentStudent.findMany({
      where: by === 'lastName'
        ? { OR: [{ parent: { lastName: exact } }, { student: { lastName: exact } }] }
        : {
            OR: [
              { parent:  { username:  contains } },
              { parent:  { lastName:  contains } },
              { parent:  { firstName: contains } },
              { student: { lastName:  contains } },
              { student: { firstName: contains } },
            ],
          },
      select: { parentId: true },
      take: 200,
    });
    const parentIds = Array.from(new Set(matches.map((m) => m.parentId))).slice(0, 20);
    if (parentIds.length === 0) return [];

    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: { in: parentIds } },
      select: {
        parent:  { select: { id: true, username: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true, gradeLevel: true, archivedAt: true } },
      },
    });

    const byParent = new Map<string, {
      id: string; username: string; name: string;
      childLastName: string;
      children: { id: string; name: string; gradeLevel: string | null; archived: boolean }[];
    }>();
    for (const link of links) {
      const entry = byParent.get(link.parent.id) ?? {
        id: link.parent.id,
        username: link.parent.username,
        name: `${link.parent.firstName} ${link.parent.lastName}`,
        childLastName: link.student.lastName,
        children: [],
      };
      entry.children.push({
        id: link.student.id,
        name: `${link.student.firstName} ${link.student.lastName}`,
        gradeLevel: link.student.gradeLevel,
        archived: link.student.archivedAt !== null,
      });
      byParent.set(link.parent.id, entry);
    }
    return Array.from(byParent.values());
  }

  async changeParent(studentId: string, newParentId: string, adminId?: string) {
    const [student, newParent] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: studentId },   select: { id: true, role: true, firstName: true, lastName: true } }),
      this.prisma.user.findUnique({ where: { id: newParentId }, select: { id: true, role: true, username: true } }),
    ]);
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Student account not found.');
    if (!newParent || newParent.role !== 'PARENT') throw new NotFoundException('Parent account not found.');

    const current = await this.prisma.parentStudent.findFirst({
      where:  { studentId },
      select: { parentId: true, parent: { select: { username: true } } },
    });
    if (current?.parentId === newParentId) {
      throw new BadRequestException('This student is already linked to that parent.');
    }

    const result = { removedParent: null as string | null };
    await this.prisma.$transaction(async (tx) => {
      if (current) await tx.parentStudent.deleteMany({ where: { studentId } });
      await tx.parentStudent.create({ data: { parentId: newParentId, studentId } });

      // A parent with no students left is removed, so there are never empty parents.
      if (current) {
        const left = await tx.parentStudent.count({ where: { parentId: current.parentId } });
        if (left === 0) {
          await tx.user.delete({ where: { id: current.parentId } });
          result.removedParent = current.parent.username;
        }
      }
    });

    await this.adminLog.log(
      adminId,
      'STUDENT_PARENT_CHANGED',
      'USER',
      studentId,
      'Moved ' + student.firstName + ' ' + student.lastName + ' from ' + (current ? current.parent.username : 'no parent') + ' to ' + newParent.username,
      { fromParent: current?.parent.username ?? null, toParent: newParent.username, removedParent: result.removedParent },
    );

    return {
      message:
        student.firstName + ' ' + student.lastName + ' is now linked to ' + newParent.username + '.' +
        (result.removedParent ? ' The empty parent account ' + result.removedParent + ' was removed.' : ''),
      removedParent: result.removedParent,
    };
  }

  async getDeletePreview(id: string) {
    const target = await this.prisma.user.findUnique({
      where:  { id },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found.');

    if (target.role === 'PARENT') {
      const links = await this.prisma.parentStudent.findMany({
        where:  { parentId: id },
        select: { student: { select: { id: true, firstName: true, lastName: true } } },
      });
      return {
        role: 'PARENT',
        canDelete: links.length === 0,
        children: links.map((l) => ({ id: l.student.id, name: l.student.firstName + ' ' + l.student.lastName })),
      };
    }

    if (target.role === 'STUDENT') {
      const [attendance, fslProgress, assessmentAttempts, link] = await Promise.all([
        this.prisma.attendance.count({ where: { studentId: id } }),
        this.prisma.fSLProgress.count({ where: { studentId: id } }),
        this.prisma.assessmentAttempt.count({ where: { userId: id } }),
        this.prisma.parentStudent.findFirst({
          where:  { studentId: id },
          select: { parentId: true, parent: { select: { username: true } } },
        }),
      ]);
      let willDeleteParent: string | null = null;
      if (link) {
        const others = await this.prisma.parentStudent.count({
          where: { parentId: link.parentId, NOT: { studentId: id } },
        });
        if (others === 0) willDeleteParent = link.parent.username;
      }
      return {
        role: 'STUDENT',
        canDelete: true,
        willDeleteParent,
        records: { attendance, fslProgress, assessmentAttempts },
      };
    }

    return { role: target.role, canDelete: true };
  }

  async listArchived(filters: { status?: string; gradeLevel?: string; from?: string; to?: string; q?: string }) {
    const where: Record<string, unknown> = { role: 'STUDENT' };

    const statuses = ['GRADUATED', 'TRANSFERRED_OUT', 'DROPPED_OUT', 'OTHER'];
    if (filters.status && statuses.includes(filters.status)) where.archiveStatus = filters.status;
    if (filters.gradeLevel && /^(?:KINDERGARTEN|GRADE_(?:1[0-2]|[1-9]))$/.test(filters.gradeLevel)) where.gradeLevel = filters.gradeLevel;

    const day = /^\d{4}-\d{2}-\d{2}$/;
    const range: { not: null; gte?: Date; lt?: Date } = { not: null };
    if (filters.from && day.test(filters.from)) range.gte = new Date(filters.from + 'T00:00:00+08:00');
    if (filters.to && day.test(filters.to)) {
      range.lt = new Date(new Date(filters.to + 'T00:00:00+08:00').getTime() + 24 * 60 * 60 * 1000);
    }
    where.archivedAt = range;

    const q = (filters.q ?? '').trim();
    if (q) {
      const contains = { contains: q, mode: 'insensitive' };
      where.OR = [{ firstName: contains }, { lastName: contains }, { username: contains }];
    }

    const rows = await this.prisma.user.findMany({
      where: where as any,
      orderBy: { archivedAt: 'desc' },
      take: 500,
      select: {
        id: true, username: true, firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, archiveStatus: true, archiveNote: true, archivedAt: true, archivedById: true,
      },
    });

    const adminIds = Array.from(new Set(rows.map((r) => r.archivedById).filter((x): x is string => !!x)));
    const admins = adminIds.length
      ? await this.prisma.user.findMany({
          where:  { id: { in: adminIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const adminName = new Map(admins.map((a) => [a.id, a.firstName + ' ' + a.lastName]));

    const links = rows.length
      ? await this.prisma.parentStudent.findMany({
          where:  { studentId: { in: rows.map((r) => r.id) } },
          select: { studentId: true, parent: { select: { username: true, firstName: true, lastName: true } } },
        })
      : [];
    const parentOf = new Map(links.map((l) => [l.studentId, l.parent]));

    return {
      total: rows.length,
      data: rows.map((r) => {
        const parent = parentOf.get(r.id);
        return {
          id:            r.id,
          username:      r.username,
          firstName:     r.firstName,
          lastName:      r.lastName,
          gradeLevel:    r.gradeLevel,
          rfidCard:      r.rfidCard,
          archiveStatus: r.archiveStatus,
          archiveNote:   r.archiveNote,
          archivedAt:    r.archivedAt,
          archivedBy:    r.archivedById ? (adminName.get(r.archivedById) ?? null) : null,
          parent:        parent ? { username: parent.username, name: parent.firstName + ' ' + parent.lastName } : null,
        };
      }),
    };
  }

  async archiveStudent(id: string, dto: ArchiveStudentDto, adminId?: string) {
    const note = (dto.note ?? '').trim();
    if (dto.status === 'OTHER' && note.length < 3) {
      throw new BadRequestException('Please write a short note when the status is Other.');
    }

    const student = await this.prisma.user.findUnique({
      where:  { id },
      select: { id: true, role: true, username: true, firstName: true, lastName: true, archivedAt: true },
    });
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Student account not found.');
    if (student.archivedAt) throw new BadRequestException('This student is already archived.');

    const link = await this.prisma.parentStudent.findFirst({
      where:  { studentId: id },
      select: { parentId: true, parent: { select: { username: true } } },
    });

    const now = new Date();
    const result = { parentInactive: false };

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data:  { archivedAt: now, archiveStatus: dto.status as any, archiveNote: note || null, archivedById: adminId ?? null },
      });
      // End every login session and close any open password request.
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.passwordResetRequest.updateMany({
        where: { userId: id, status: 'PENDING' },
        data:  { status: 'REJECTED', resolvedAt: now, resolvedBy: adminId ?? null },
      });
      // A parent with no active students left cannot log in until a student is restored or linked.
      if (link) {
        const active = await tx.parentStudent.count({
          where: { parentId: link.parentId, student: { archivedAt: null } },
        });
        if (active === 0) {
          await tx.refreshToken.deleteMany({ where: { userId: link.parentId } });
          result.parentInactive = true;
        }
      }
    });

    await this.adminLog.log(
      adminId,
      'STUDENT_ARCHIVED',
      'USER',
      id,
      'Archived student ' + student.username + ' (' + dto.status + ')',
      { status: dto.status, note: note || null, parentInactive: result.parentInactive, parent: link?.parent.username ?? null },
    );

    return {
      message:
        student.firstName + ' ' + student.lastName + ' was archived.' +
        (result.parentInactive
          ? ' The parent account ' + (link?.parent.username ?? '') + ' is inactive until a student is restored or linked.'
          : ''),
      parentInactive: result.parentInactive,
    };
  }

  async restoreStudent(id: string, dto: RestoreStudentDto, adminId?: string) {
    const student = await this.prisma.user.findUnique({
      where:  { id },
      select: { id: true, role: true, username: true, firstName: true, lastName: true, archivedAt: true, archiveStatus: true, archiveNote: true },
    });
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Student account not found.');
    if (!student.archivedAt) throw new BadRequestException('This student is not archived.');

    await this.prisma.user.update({
      where: { id },
      data:  { archivedAt: null, archiveStatus: null, archiveNote: null, archivedById: null, gradeLevel: dto.gradeLevel as any },
    });

    await this.adminLog.log(
      adminId,
      'STUDENT_RESTORED',
      'USER',
      id,
      'Restored student ' + student.username + ' to ' + dto.gradeLevel,
      { previousStatus: student.archiveStatus, previousNote: student.archiveNote, archivedAt: student.archivedAt, gradeLevel: dto.gradeLevel },
    );

    return { message: student.firstName + ' ' + student.lastName + ' was restored to ' + (String(dto.gradeLevel) === 'KINDERGARTEN' ? 'Kindergarten' : String(dto.gradeLevel).replace('GRADE_', 'Grade ')) + '.' };
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where:  { id: userId },
      data:   { pushToken: fcmToken },
      select: { id: true, pushToken: true },
    });
  }


  async getAuditLog(userId: string) {
    return this.prisma.auditLog.findMany({
      where:   { userId },
      orderBy: { changedAt: 'desc' },
    });
  }
}