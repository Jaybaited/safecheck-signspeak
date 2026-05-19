import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

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

  // ── POST /password-reset/request ─────────────────────────────────────────
  async requestReset(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('No account found with that username.');

    // Prevent duplicate pending requests
    const existing = await this.prisma.passwordResetRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have a pending reset request. Please wait for your admin to approve it.',
      );
    }

    await this.prisma.passwordResetRequest.create({
      data: { username, userId: user.id },
    });

    return { message: 'Password reset request submitted. Please wait for your admin to approve it.' };
  }

  // ── GET /password-reset/requests ─────────────────────────────────────────
  async getAllRequests() {
    const requests = await this.prisma.passwordResetRequest.findMany({
      orderBy: { requestedAt: 'desc' },
    });

    // Enrich with user info (firstName, lastName, role)
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const user = await this.prisma.user.findUnique({
          where: { id: r.userId },
          select: { firstName: true, lastName: true, role: true },
        });
        return { ...r, user: user ?? null };
      }),
    );

    return enriched;
  }

  // ── GET /password-reset/requests/pending-count ────────────────────────────
  async getPendingCount() {
    const count = await this.prisma.passwordResetRequest.count({
      where: { status: 'PENDING' },
    });
    return { count };
  }

  // ── POST /password-reset/requests/:id/approve ────────────────────────────
  async approveRequest(requestId: string, adminId: string) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Reset request not found.');
    if (request.status !== 'PENDING')
      throw new BadRequestException('This request has already been resolved.');

   // was: const plainPassword = this.generate6DigitCode();
const plainPassword = this.generatePassword();
    const hashed = await bcrypt.hash(plainPassword, 10);

    // Update the user's password and force change on next login
    await this.prisma.user.update({
      where: { id: request.userId },
      data: { password: hashed, mustChangePassword: true },
    });

    // Mark request approved
    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        resolvedBy: adminId,
        generatedPassword: plainPassword, // store plain temporarily for display
      },
    });

    return {
      message: 'Password reset approved.',
      username: request.username,
      generatedPassword: plainPassword,
    };
  }

  // ── POST /password-reset/requests/:id/reject ─────────────────────────────
  async rejectRequest(requestId: string, adminId: string) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Reset request not found.');
    if (request.status !== 'PENDING')
      throw new BadRequestException('This request has already been resolved.');

    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', resolvedAt: new Date(), resolvedBy: adminId },
    });

    return { message: 'Password reset request rejected.' };
  }
}