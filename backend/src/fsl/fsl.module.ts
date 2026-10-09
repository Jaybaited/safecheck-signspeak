import { Module } from '@nestjs/common';
import { FslController } from './fsl.controller';
import { FslService } from './fsl.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FslController],
  providers: [FslService, PrismaService],
})
export class FslModule {}