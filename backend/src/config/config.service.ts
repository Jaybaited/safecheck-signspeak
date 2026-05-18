import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

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