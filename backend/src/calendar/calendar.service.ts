import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dateStr: string, name: string) {
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Please type a name for this day.');
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateStr) {
      throw new BadRequestException('That is not a real date.');
    }
    try {
      return await this.prisma.schoolHoliday.create({ data: { date, name: cleanName } });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('That date is already in the calendar.');
      throw err;
    }
  }

  async remove(id: string) {
    const found = await this.prisma.schoolHoliday.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('That day was not found.');
    await this.prisma.schoolHoliday.delete({ where: { id } });
    return { success: true };
  }
}