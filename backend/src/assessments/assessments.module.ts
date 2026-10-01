import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService, PrismaService],
})
export class AssessmentsModule {}