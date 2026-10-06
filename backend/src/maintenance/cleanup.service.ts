import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const LOGIN_ATTEMPT_RETENTION_DAYS = 7;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Every night at 3:30 AM Manila time.
  @Cron('30 3 * * *', { timeZone: 'Asia/Manila' })
  async purge() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const attempts = await this.prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    const tokens = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    this.logger.log(
      'Removed ' + attempts.count + ' old login attempts and ' + tokens.count + ' expired refresh tokens',
    );
    return { loginAttempts: attempts.count, refreshTokens: tokens.count };
  }
}