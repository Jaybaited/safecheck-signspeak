import { Global, Module } from '@nestjs/common';
import { AdminLogService } from './admin-log.service';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  providers: [AdminLogService, PrismaService],
  exports:   [AdminLogService],
})
export class AdminLogModule {}