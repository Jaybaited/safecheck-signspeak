import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginResponse } from './types';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
    ip: string,
  ): Promise<LoginResponse> {
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: { ip, username, success: false, createdAt: { gte: windowStart } },
    });

    if (failedAttempts >= MAX_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many failed login attempts. Please try again after 15 minutes.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { username } });
    const isValid = user ? await bcrypt.compare(password, user.password) : false;

    await this.prisma.loginAttempt.create({
      data: { ip, username, success: isValid },
    });

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'a114f225-4e4e-4e54-831c-90d8751864fb',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production',
      expiresIn: '7d',
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refresh(userId: string, refreshToken: string): Promise<{ accessToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
      }
      throw new UnauthorizedException('Refresh token expired. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'a114f225-4e4e-4e54-831c-90d8751864fb',
      expiresIn: '15m',
    });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        gradeLevel: true,
        rfidCard: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}