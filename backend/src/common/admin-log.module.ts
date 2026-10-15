import { Global, Module } from '@nestjs/common';
import { AdminLogService } from './admin-log.service';
import { AdminLogController } from './admin-log.controller';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
  controllers: [AdminLogController],
  providers: [AdminLogService, PrismaService],
  exports: [AdminLogService],
})
export class AdminLogModule {}