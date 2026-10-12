import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminLogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Best effort: a logging problem must never block the admin's action. */
  async log(
    adminId: string | undefined,
    action: string,
    targetType: string,
    targetId: string | null,
    summary: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    if (!adminId) return;
    try {
      await this.prisma.adminActionLog.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          summary,
          details: details as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (err) {
      console.error('AdminLog failed:', err);
    }
  }
}