import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}


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
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id:   { not: currentUserId } },
          { role: { not: 'ADMIN'       } },
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


  async create(createUserDto: CreateUserDto): Promise<{
    user: Record<string, unknown>;
    generatedPassword: string;
    parentAccount?: { username: string; generatedPassword: string };
  }> {
    const isStudent = createUserDto.role === 'STUDENT';


    const plainPassword   = await this.generateUniquePassword();
    const hashedPassword  = await bcrypt.hash(plainPassword, 10);


    // ── Use new retry-safe username builder ───────────────────────────────
    const username = await this.buildUniqueUsername(
      createUserDto.lastName,
      createUserDto.rfidCard,
    );
    const userId = this.generateUuid();


    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO users (id, username, email, password, role, "firstName", "lastName", "gradeLevel", "rfidCard", "phoneNumber", "photoUrl", "mustChangePassword", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8::"GradeLevel", $9, $10, $11, $12, NOW(), NOW())`,
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
      where:   { username },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, email: true, role: true,
        firstName: true, lastName: true, gradeLevel: true,
        rfidCard: true, phoneNumber: true, photoUrl: true,
        mustChangePassword: true, createdAt: true, updatedAt: true,
      },
    });


    // ── Auto-create parent account when a student is created ──────────────
    let parentAccount: { username: string; generatedPassword: string } | undefined;


    if (isStudent && createUserDto.rfidCard) {
      const parentUsername       = await this.buildUniqueParentUsername(
        createUserDto.rfidCard,
        createUserDto.lastName,
      );
      const parentPlainPassword  = await this.generateUniquePassword();
      const parentHashedPassword = await bcrypt.hash(parentPlainPassword, 10);
      const parentId             = this.generateUuid();


      const existingParent = await this.prisma.user.findUnique({
        where: { username: parentUsername },
      });


      if (existingParent) {
        await this.prisma.parentStudent.upsert({
          where: {
            parentId_studentId: {
              parentId:  existingParent.id,
              studentId: userId,
            },
          },
          create: { parentId: existingParent.id, studentId: userId },
          update: {},
        });
        parentAccount = {
          username:          existingParent.username,
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
            'Parent',
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
            username:          parentUsername,
            generatedPassword: parentPlainPassword,
          };
        } catch (err) {
          console.error('Warning: Parent auto-creation failed:', err);
        }
      }
    }


    return {
      user:              createdUser as Record<string, unknown>,
      generatedPassword: plainPassword,
      ...(parentAccount ? { parentAccount } : {}),
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


    return updated;
  }


  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }


  async getStats() {
    const [admins, teachers, students, parents] = await Promise.all([
      this.prisma.user.count({ where: { role: 'ADMIN'   } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'PARENT'  } }),
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
      where:   { parentId },
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