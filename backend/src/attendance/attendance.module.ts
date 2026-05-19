import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NetworkTimeService } from '../common/services/network-time.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, NetworkTimeService],
  exports: [AttendanceService],
})
export class AttendanceModule {}