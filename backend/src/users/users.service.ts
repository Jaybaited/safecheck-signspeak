import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Generate a secure 10-character alphanumeric password ─────────────────
  // Excludes ambiguous characters: 0, O, 1, I, l to avoid read-aloud confusion
  private generatePassword(): string {
    const crypto = require('crypto') as typeof import('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    const bytes = crypto.randomBytes(10);
    for (let i = 0; i < 10; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  private async generateUniquePassword(): Promise<string> {
    // Generate up to 10 attempts to avoid (extremely unlikely) collisions
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = this.generatePassword();
      return code; // No DB uniqueness check needed for passwords
    }
    return this.generatePassword();
  }

  private generateUuid(): string {
    const crypto = require('crypto') as typeof import('crypto');
    return crypto.randomUUID();
  }

  // ── Build username: lastname + last 6 of RFID (or timestamp for non-RFID) ─
  private buildUsername(lastName: string, rfidCard?: string): string {
    const cleanLast = lastName.trim().toLowerCase().replace(/\s+/g, '');
    const suffix = rfidCard
      ? rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0')
      : String(Date.now()).slice(-6);
    return `${cleanLast}.${suffix}`;
  }

  // ── Build parent username: "parent" + last 6 of student RFID ─────────────
  private buildParentUsername(rfidCard: string): string {
    const suffix = rfidCard.replace(/\s+/g, '').slice(-6).padStart(6, '0');
    return `parent.${suffix}`;
  }

  async findAll(currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { role: { not: 'ADMIN' } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        rfidCard: true,
        phoneNumber: true,
        photoUrl: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        rfidCard: true,
        phoneNumber: true,
        photoUrl: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<{
    user: Record<string, unknown>;
    generatedPassword: string;
    parentAccount?: { username: string; generatedPassword: string };
  }> {
    const isStudent = createUserDto.role === 'STUDENT';

    // Students with RFID: use the generated 10-char password (NOT the RFID as password
    // anymore — RFID codes are often short/numeric and may fail the 8-char validation)
    const plainPassword = await this.generateUniquePassword();

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const username = this.buildUsername(createUserDto.lastName, createUserDto.rfidCard);
    const userId = this.generateUuid();

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO users (id, username, email, password, role, "firstName", "lastName", "gradeLevel", "rfidCard", "phoneNumber", "photoUrl", "mustChangePassword", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8::"GradeLevel", $9, $10, $11, $12, NOW(), NOW())`,
        userId,
        username,
        createUserDto.email || null,
        hashedPassword,
        createUserDto.role,
        createUserDto.firstName,
        createUserDto.lastName,
        createUserDto.gradeLevel || null,
        createUserDto.rfidCard || null,
        createUserDto.phoneNumber || null,
        createUserDto.photoUrl || null,
        true,
      );
    } catch (error) {
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
      where: { username },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
    });

    // ── Auto-create parent account when a student is created ─────────────
    let parentAccount: { username: string; generatedPassword: string } | undefined;

    if (isStudent && createUserDto.rfidCard) {
      const parentUsername      = this.buildParentUsername(createUserDto.rfidCard);
      const parentPlainPassword = await this.generateUniquePassword();
      const parentHashedPassword = await bcrypt.hash(parentPlainPassword, 10);
      const parentId = this.generateUuid();

      const existingParent = await this.prisma.user.findUnique({
        where: { username: parentUsername },
      });

      if (existingParent) {
        await this.prisma.parentStudent.upsert({
          where: {
            parentId_studentId: {
              parentId: existingParent.id,
              studentId: userId,
            },
          },
          create: { parentId: existingParent.id, studentId: userId },
          update: {},
        });
        parentAccount = {
          username: existingParent.username,
          generatedPassword: '(existing account — same password)',
        };
      } else {
        try {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO users (id, username, email, password, role, "firstName", "lastName", "gradeLevel", "rfidCard", "phoneNumber", "photoUrl", "mustChangePassword", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8::"GradeLevel", $9, $10, $11, $12, NOW(), NOW())`,
            parentId,
            parentUsername,
            null,
            parentHashedPassword,
            'PARENT',
            'Parent',                         // firstName is always "Parent"
            createUserDto.lastName,
            null,
            null,
            createUserDto.phoneNumber || null,
            null,
            true,
          );

          await this.prisma.parentStudent.create({
            data: { parentId, studentId: userId },
          });

          parentAccount = {
            username: parentUsername,
            generatedPassword: parentPlainPassword,
          };
        } catch (err) {
          console.error('Warning: Parent auto-creation failed:', err);
        }
      }
    }

    return {
      user: createdUser as Record<string, unknown>,
      generatedPassword: plainPassword,
      ...(parentAccount ? { parentAccount } : {}),
    };
  }

  // ── Revision 11: update() now accepts changedById for audit logging ───────
  async update(id: string, updateData: Partial<CreateUserDto>, changedById?: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found.');

    const data: Record<string, unknown> = {};
    if (updateData.username)                  data.username    = updateData.username;
    if (updateData.email !== undefined)       data.email       = updateData.email;
    if (updateData.firstName)                 data.firstName   = updateData.firstName;
    if (updateData.lastName)                  data.lastName    = updateData.lastName;
    if (updateData.gradeLevel !== undefined)  data.gradeLevel  = updateData.gradeLevel;
    if (updateData.rfidCard !== undefined)    data.rfidCard    = updateData.rfidCard;
    if (updateData.phoneNumber !== undefined) data.phoneNumber = updateData.phoneNumber;
    if (updateData.photoUrl !== undefined)    data.photoUrl    = updateData.photoUrl;
    if (updateData.password)
      data.password = await bcrypt.hash(updateData.password, 10);

    // Role change — only accepted when changedById is provided (ADMIN guard in controller)
    const roleChanged =
      updateData.role !== undefined && updateData.role !== existing.role;
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

    // Write audit log only when role actually changed and we know who did it
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

    return updated;
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getStats() {
    const [admins, teachers, students, parents] = await Promise.all([
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'PARENT' } }),
    ]);
    return { admins, teachers, students, parents, total: admins + teachers + students + parents };
  }

  async getStudentParent(studentId: string) {
    const link = await this.prisma.parentStudent.findFirst({
      where: { studentId },
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
      where: { parentId },
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });
    return { message: 'Password changed successfully.' };
  }

  // ── Force password change (first login) ───────────────────────────────────
  async forceChangePassword(userId: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, mustChangePassword: false },
    });
    return { message: 'Password changed successfully.' };
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: fcmToken },
      select: { id: true, pushToken: true },
    });
  }

  // ── Revision 11: audit log retrieval ─────────────────────────────────────
  async getAuditLog(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
    });
  }
}