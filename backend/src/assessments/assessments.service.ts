import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import {
  AssessmentAudience,
  AssessmentType,
  AttemptStatus,
} from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto, createdBy: string) {
    // Enforce single-active-storybook rule
    if (dto.type === AssessmentType.STORYBOOK && dto.isActive) {
      await this.prisma.assessment.updateMany({
        where: { type: AssessmentType.STORYBOOK, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        audience: dto.audience,
        type: dto.type,
        gradeLevel: dto.gradeLevel,
        isActive: dto.isActive ?? false,
        isPublished: false,
        createdBy,
        questions: {
          create: dto.questions.map((q, index) => ({
            order: index + 1,
            type: q.type,
            prompt: q.prompt,
            mediaUrl: q.mediaUrl,
            wordId: q.wordId,
            choices: q.choices,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async publish(id: string, callerId: string, callerRole: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (callerRole !== 'ADMIN' && assessment.createdBy !== callerId) {
      throw new ForbiddenException('You can only publish your own assessments');
    }
    return this.prisma.assessment.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async findForRole(role: string) {
  const audience = role === 'TEACHER' ? AssessmentAudience.TEACHER : AssessmentAudience.STUDENT;

  return this.prisma.assessment.findMany({
    where: {
      audience,
      isPublished: true,
      ...(audience === AssessmentAudience.STUDENT
        ? { OR: [{ type: { not: AssessmentType.STORYBOOK } }, { isActive: true }] }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

  async getWithQuestions(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async startAttempt(assessmentId: string, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: { assessmentId, userId, status: AttemptStatus.IN_PROGRESS },
    });
    if (existing) return existing;

    return this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId,
        status: AttemptStatus.IN_PROGRESS,
        scoreVisibleToUser: assessment.audience !== AssessmentAudience.TEACHER,
      },
    });
  }

  async submitResponse(attemptId: string, userId: string, dto: SubmitResponseDto) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('This attempt is already submitted');
    }

    const question = await this.prisma.assessmentQuestion.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const isCorrect = dto.submittedSign
      ? dto.submittedSign.trim().toLowerCase() === (question.correctAnswer ?? '').trim().toLowerCase()
      : null;

    return this.prisma.assessmentResponse.upsert({
      where: { attemptId_questionId: { attemptId, questionId: dto.questionId } },
      update: { submittedSign: dto.submittedSign, isCorrect },
      create: {
        attemptId,
        questionId: dto.questionId,
        submittedSign: dto.submittedSign,
        isCorrect,
      },
    });
  }

  async completeAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { responses: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');

    const totalQuestions = await this.prisma.assessmentQuestion.count({
      where: { assessmentId: attempt.assessmentId },
    });
    const correctCount = attempt.responses.filter((r) => r.isCorrect).length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    return this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        score,
        submittedAt: new Date(),
      },
    });
  }

  async getMyAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { responses: true, assessment: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');

    // Hide score if this attempt belongs to a TEACHER-audience assessment
    if (!attempt.scoreVisibleToUser) {
      return { ...attempt, score: null };
    }
    return attempt;
  }

  async adminReviewAttempt(attemptId: string, adminId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { responses: true, assessment: true, user: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { reviewedByAdminId: adminId, reviewedAt: new Date() },
    });

    return attempt; // full data including real score, for ADMIN only
  }
}