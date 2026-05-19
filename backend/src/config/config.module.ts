import { Module } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { AppConfigController } from './config.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppConfigController],
  providers: [AppConfigService, PrismaService],
  exports: [AppConfigService],
})
export class AppConfigModule {}