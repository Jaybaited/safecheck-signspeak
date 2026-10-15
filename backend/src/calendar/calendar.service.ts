import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLogService } from '../common/admin-log.service';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLog: AdminLogService,
  ) {}

  list(from?: string, to?: string) {
    for (const v of [from, to]) {
      if (v && !DAY_RE.test(v)) {
        throw new BadRequestException('from and to must be dates like 2026-09-30.');
      }
    }
    const date: { gte?: Date; lte?: Date } = {};
    if (from) date.gte = new Date(from + 'T00:00:00.000Z');
    if (to) date.lte = new Date(to + 'T00:00:00.000Z');
    return this.prisma.schoolHoliday.findMany({ where: { date }, orderBy: { date: 'asc' } });
  }

  async create(dateStr: string, name: string, adminId?: string) {
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Please type a name for this day.');
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr) {
      throw new BadRequestException('That is not a real date.');
    }
    try {
      const created = await this.prisma.schoolHoliday.create({ data: { date, name: cleanName } });
      await this.adminLog.log(
        adminId,
        'HOLIDAY_ADDED',
        'SCHOOL_HOLIDAY',
        created.id,
        `Added ${cleanName} (${dateStr}) to the school calendar`,
        { date: dateStr, name: cleanName },
      );
      return created;
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('That date is already in the calendar.');
      throw err;
    }
  }

  async remove(id: string, adminId?: string) {
    const found = await this.prisma.schoolHoliday.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('That day was not found.');
    await this.prisma.schoolHoliday.delete({ where: { id } });
    await this.adminLog.log(
      adminId,
      'HOLIDAY_REMOVED',
      'SCHOOL_HOLIDAY',
      id,
      `Removed ${found.name} (${found.date.toISOString().slice(0, 10)}) from the school calendar`,
      { date: found.date.toISOString().slice(0, 10), name: found.name },
    );
    return { success: true };
  }
}