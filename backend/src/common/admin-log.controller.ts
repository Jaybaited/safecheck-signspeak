import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Midnight of a calendar day in Manila time (UTC+8).
function manilaStart(day: string): Date {
  const d = new Date(`${day}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`"${day}" is not a real date.`);
  }
  return d;
}

@Controller('admin-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async list(
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    for (const v of [from, to]) {
      if (v && !DAY_RE.test(v)) {
        throw new BadRequestException('from and to must be dates like 2026-10-15.');
      }
    }

    const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw ?? '25', 10) || 25));

    const where: Prisma.AdminActionLogWhereInput = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    if (from || to) {
      const range: { gte?: Date; lt?: Date } = {};
      if (from) range.gte = manilaStart(from);
      if (to) range.lt = new Date(manilaStart(to).getTime() + 24 * 60 * 60 * 1000);
      where.createdAt = range;
    }

    const term = (q ?? '').trim();
    if (term) {
      where.OR = [
        { summary: { contains: term, mode: 'insensitive' } },
        { targetId: { equals: term } },
      ];
    }

    const [total, rows, actionRows, adminRows] = await Promise.all([
      this.prisma.adminActionLog.count({ where }),
      this.prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminActionLog.groupBy({ by: ['action'], orderBy: { action: 'asc' } }),
      this.prisma.adminActionLog.groupBy({ by: ['adminId'], orderBy: { adminId: 'asc' } }),
    ]);

    const ids = Array.from(
      new Set([...rows.map((r) => r.adminId), ...adminRows.map((r) => r.adminId)]),
    );
    const users = ids.length
      ? await this.prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nameOf = (id: string) => {
      const u = users.find((x) => x.id === id);
      return u ? `${u.firstName} ${u.lastName}` : 'Deleted admin';
    };

    return {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      actions: actionRows.map((r) => r.action),
      admins: adminRows.map((r) => ({ id: r.adminId, name: nameOf(r.adminId) })),
      data: rows.map((r) => ({
        id: r.id,
        adminId: r.adminId,
        adminName: nameOf(r.adminId),
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        summary: r.summary,
        details: r.details,
        createdAt: r.createdAt,
      })),
    };
  }
}