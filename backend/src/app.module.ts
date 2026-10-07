import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppConfigModule } from './config/config.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { FslModule } from './fsl/fsl.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    AttendanceModule,
    NotificationsModule,
    AppConfigModule,
    PasswordResetModule,
    AssessmentsModule,
    FslModule,
    MaintenanceModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}