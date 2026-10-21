import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLogService } from '../common/admin-log.service';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLog: AdminLogService,
  ) {}

  async getByGroup(group: string) {
    return this.prisma.appConfig.findMany({
      where: { group },
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true,
        value: true,
        label: true,
        group: true,
        sortOrder: true,
      },
    });
  }

  async saveSchoolYear(dto: { name: string; start: string; end: string }, adminId?: string) {
    const parts = dto.name.split('-').map((n) => parseInt(n, 10));
    if (!parts[0] || !parts[1] || parts[1] !== parts[0] + 1) {
      throw new BadRequestException('The school year must cover two years in a row, for example 2026-2027.');
    }
    const startDate = new Date(dto.start + 'T00:00:00.000Z');
    const endDate = new Date(dto.end + 'T00:00:00.000Z');
    if (
      Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) ||
      startDate.toISOString().slice(0, 10) !== dto.start || endDate.toISOString().slice(0, 10) !== dto.end
    ) {
      throw new BadRequestException('Please enter real start and end dates.');
    }
    if (endDate.getTime() <= startDate.getTime()) {
      throw new BadRequestException('The end date must be after the start date.');
    }

    const previous = await this.prisma.appConfig.findUnique({ where: { key: 'school_year' } });
    const rows = [
      { key: 'school_year',       value: dto.name,  label: 'School year',        sortOrder: 1 },
      { key: 'school_year_start', value: dto.start, label: 'School year starts', sortOrder: 2 },
      { key: 'school_year_end',   value: dto.end,   label: 'School year ends',   sortOrder: 3 },
    ];
    for (const r of rows) {
      await this.prisma.appConfig.upsert({
        where:  { key: r.key },
        update: { value: r.value, label: r.label, group: 'school_year', sortOrder: r.sortOrder },
        create: { key: r.key, value: r.value, label: r.label, group: 'school_year', sortOrder: r.sortOrder },
      });
    }

    await this.adminLog.log(
      adminId,
      'SCHOOL_YEAR_SET',
      'CONFIG',
      null,
      'Set the school year to ' + dto.name + ' (' + dto.start + ' to ' + dto.end + ')',
      { previous: previous?.value ?? null },
    );
    return { message: 'School year saved.', name: dto.name };
  }

  async getAll() {
    return this.prisma.appConfig.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
      select: {
        key: true,
        value: true,
        label: true,
        group: true,
        sortOrder: true,
      },
    });
  }
}