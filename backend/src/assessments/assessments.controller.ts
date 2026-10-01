import {
  Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  create(@Body() dto: CreateAssessmentDto, @Req() req: any) {
    const callerId = req.user.id ?? req.user.sub;
    return this.assessmentsService.create(dto, callerId);
  }

  @Patch(':id/publish')
  @Roles('ADMIN', 'TEACHER')
  publish(@Param('id') id: string, @Req() req: any) {
    const callerId = req.user.id ?? req.user.sub;
    return this.assessmentsService.publish(id, callerId, req.user.role);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  findForRole(@Req() req: any) {
    return this.assessmentsService.findForRole(req.user.role);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  getWithQuestions(@Param('id') id: string) {
    return this.assessmentsService.getWithQuestions(id);
  }

  @Post(':id/attempts')
  @Roles('TEACHER', 'STUDENT')
  startAttempt(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.assessmentsService.startAttempt(id, userId);
  }

  @Post('attempts/:attemptId/responses')
  @Roles('TEACHER', 'STUDENT')
  submitResponse(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitResponseDto,
    @Req() req: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.assessmentsService.submitResponse(attemptId, userId, dto);
  }

  @Patch('attempts/:attemptId/complete')
  @Roles('TEACHER', 'STUDENT')
  completeAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.assessmentsService.completeAttempt(attemptId, userId);
  }

  @Get('attempts/:attemptId')
  @Roles('TEACHER', 'STUDENT')
  getMyAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.assessmentsService.getMyAttempt(attemptId, userId);
  }

  @Patch('attempts/:attemptId/review')
  @Roles('ADMIN')
  adminReviewAttempt(@Param('attemptId') attemptId: string, @Req() req: any) {
    const adminId = req.user.id ?? req.user.sub;
    return this.assessmentsService.adminReviewAttempt(attemptId, adminId);
  }
}