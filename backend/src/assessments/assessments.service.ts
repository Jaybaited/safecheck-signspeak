import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { ReviewAttemptDto } from './dto/review-attempt.dto';
import {
  AssessmentAttempt,
  AssessmentAudience,
  AssessmentType,
  AttemptStatus,
} from '@prisma/client';

const USER_BRIEF = { id: true, firstName: true, lastName: true, username: true, gradeLevel: true } as const;

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Students see their result only after an admin reviews the attempt.
   * Set ASSESSMENT_REQUIRE_REVIEW=false in backend/.env to release results immediately.
   */
  private requireReview(): boolean {
    return process.env.ASSESSMENT_REQUIRE_REVIEW !== 'false';
  }

  private isReleased(a: { status: AttemptStatus; scoreVisibleToUser: boolean }): boolean {
    return a.status === AttemptStatus.GRADED && a.scoreVisibleToUser;
  }

  private async hasPassedLevel(userId: string, level: number): Promise<boolean> {
    const n = await this.prisma.assessmentAttempt.count({
      where: {
        userId,
        passed: true,
        status: AttemptStatus.GRADED,
        assessment: { level, audience: AssessmentAudience.STUDENT, isPublished: true },
      },
    });
    return n > 0;
  }

  private toOwnerAttempt(a: AssessmentAttempt) {
    const released = this.isReleased(a);
    return {
      id: a.id,
      assessmentId: a.assessmentId,
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      reviewedAt: a.reviewedAt,
      score: released ? a.score : null,
      passed: released ? a.passed : null,
    };
  }

  async create(dto: CreateAssessmentDto, createdBy: string) {
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
        level: dto.level,
        passMark: dto.passMark ?? 70,
        lessonVideoUrl: dto.lessonVideoUrl,
        lessonDescription: dto.lessonDescription,
        isActive: dto.isActive ?? false,
        isPublished: false,
        createdBy,
        questions: {
          create: dto.questions.map((q, index) => ({
            order: index + 1,
            type: q.type,
            prompt: q.prompt,
            mediaUrl: q.mediaUrl,
            captionUrl: q.captionUrl,
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

  /** Level cards for the student: locked, available, in progress, awaiting review, failed, or passed. */
  async getLevelsForStudent(userId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { audience: AssessmentAudience.STUDENT, isPublished: true, level: { not: null } },
      orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { questions: true } } },
    });
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId: { in: assessments.map((a) => a.id) } },
      orderBy: { startedAt: 'desc' },
    });

    const passedLevels = new Set<number>();
    for (const t of attempts) {
      if (t.passed && t.status === AttemptStatus.GRADED) {
        const a = assessments.find((x) => x.id === t.assessmentId);
        if (a?.level != null) passedLevels.add(a.level);
      }
    }

    return assessments.map((a) => {
      const level = a.level as number;
      const mine = attempts.filter((t) => t.assessmentId === a.id);
      const latest = mine[0];
      const unlocked = level <= 1 || passedLevels.has(level - 1);

      let state: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'FAILED' | 'PASSED';
      if (!unlocked) state = 'LOCKED';
      else if (mine.some((t) => t.passed && t.status === AttemptStatus.GRADED)) state = 'PASSED';
      else if (latest?.status === AttemptStatus.IN_PROGRESS) state = 'IN_PROGRESS';
      else if (latest?.status === AttemptStatus.SUBMITTED) state = 'AWAITING_REVIEW';
      else if (latest?.status === AttemptStatus.GRADED) state = 'FAILED';
      else state = 'AVAILABLE';

      const released = latest ? this.isReleased(latest) : false;
      return {
        id: a.id,
        title: a.title,
        level,
        passMark: a.passMark,
        questionCount: a._count.questions,
        lessonVideoUrl: unlocked ? a.lessonVideoUrl : null,
        lessonDescription: unlocked ? a.lessonDescription : null,
        state,
        attemptId: latest?.id ?? null,
        score: released && latest ? latest.score : null,
        passed: released && latest ? latest.passed : null,
      };
    });
  }

  async getWithQuestions(id: string, user: { id: string; role: string }) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Admin and the creator see everything, including correct answers.
    if (user.role === 'ADMIN' || assessment.createdBy === user.id) return assessment;

    // Everyone else: published only, and never the correct answers.
    if (!assessment.isPublished) throw new NotFoundException('Assessment not found');

    if (user.role === 'STUDENT') {
      if (assessment.audience !== AssessmentAudience.STUDENT) {
        throw new NotFoundException('Assessment not found');
      }
      if (assessment.type === AssessmentType.STORYBOOK && !assessment.isActive) {
        throw new NotFoundException('Assessment not found');
      }
      if (assessment.level != null && assessment.level > 1) {
        const ok = await this.hasPassedLevel(user.id, assessment.level - 1);
        if (!ok) throw new ForbiddenException('Complete the previous level first');
      }
    }

    return {
      ...assessment,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      questions: assessment.questions.map(({ correctAnswer, ...rest }) => rest),
    };
  }

  async startAttempt(assessmentId: string, user: { id: string; role: string }) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment || !assessment.isPublished) {
      throw new NotFoundException('Assessment not found');
    }

    const expectedAudience =
      user.role === 'TEACHER' ? AssessmentAudience.TEACHER : AssessmentAudience.STUDENT;
    if (assessment.audience !== expectedAudience) {
      throw new ForbiddenException('This assessment is not available for your role');
    }
    if (
      user.role === 'STUDENT' &&
      assessment.type === AssessmentType.STORYBOOK &&
      !assessment.isActive
    ) {
      throw new NotFoundException('Assessment not found');
    }

    if (user.role === 'STUDENT' && assessment.level != null && assessment.level > 1) {
      const ok = await this.hasPassedLevel(user.id, assessment.level - 1);
      if (!ok) throw new ForbiddenException('Complete the previous level first');
    }

    const existing = await this.prisma.assessmentAttempt.findFirst({
      where: { assessmentId, userId: user.id, status: AttemptStatus.IN_PROGRESS },
    });
    if (existing) return this.toOwnerAttempt(existing);

    if (user.role === 'STUDENT') {
      const last = await this.prisma.assessmentAttempt.findFirst({
        where: { assessmentId, userId: user.id },
        orderBy: { startedAt: 'desc' },
      });
      if (last?.status === AttemptStatus.SUBMITTED) {
        throw new ConflictException('Your last attempt is waiting for review.');
      }
      const passed = await this.prisma.assessmentAttempt.count({
        where: { assessmentId, userId: user.id, passed: true, status: AttemptStatus.GRADED },
      });
      if (passed > 0) throw new ConflictException('You already passed this level.');
    }

    const created = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId,
        userId: user.id,
        status: AttemptStatus.IN_PROGRESS,
        scoreVisibleToUser: assessment.audience !== AssessmentAudience.TEACHER,
      },
    });
    return this.toOwnerAttempt(created);
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
    // The question must belong to the assessment this attempt is for.
    if (!question || question.assessmentId !== attempt.assessmentId) {
      throw new NotFoundException('Question not found in this assessment');
    }

    const isCorrect = dto.submittedSign
      ? dto.submittedSign.trim().toLowerCase() === (question.correctAnswer ?? '').trim().toLowerCase()
      : null;

    const saved = await this.prisma.assessmentResponse.upsert({
      where: { attemptId_questionId: { attemptId, questionId: dto.questionId } },
      update: { submittedSign: dto.submittedSign, isCorrect },
      create: {
        attemptId,
        questionId: dto.questionId,
        submittedSign: dto.submittedSign,
        isCorrect,
      },
    });

    // Never tell the student whether the answer was right.
    return {
      id: saved.id,
      questionId: saved.questionId,
      submittedSign: saved.submittedSign,
      answeredAt: saved.answeredAt,
    };
  }

  async completeAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { responses: true, assessment: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This attempt is already submitted');
    }

    const totalQuestions = await this.prisma.assessmentQuestion.count({
      where: { assessmentId: attempt.assessmentId },
    });
    const correctCount = attempt.responses.filter((r) => r.isCorrect).length;
    const score =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;

    const needsReview =
      this.requireReview() && attempt.assessment.audience === AssessmentAudience.STUDENT;
    const passed = score >= attempt.assessment.passMark;

    const updated = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: needsReview
        ? { status: AttemptStatus.SUBMITTED, score, submittedAt: new Date() }
        : { status: AttemptStatus.GRADED, score, passed, submittedAt: new Date() },
    });
    return this.toOwnerAttempt(updated);
  }

  async getMyAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: true,
        assessment: {
          select: { id: true, title: true, level: true, passMark: true, type: true },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');

    const released = this.isReleased(attempt);
    return {
      ...this.toOwnerAttempt(attempt),
      assessment: attempt.assessment,
      responses: attempt.responses.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        submittedSign: r.submittedSign,
        isCorrect: released ? r.isCorrect : null,
      })),
    };
  }

  // ───── Admin ─────────────────────────────────────────────────────────

  async listAttemptsForAdmin(status?: string) {
    const valid = Object.values(AttemptStatus) as string[];
    const where = status && valid.includes(status) ? { status: status as AttemptStatus } : {};
    return this.prisma.assessmentAttempt.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { startedAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        status: true,
        score: true,
        passed: true,
        startedAt: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedByAdminId: true,
        user: { select: { id: true, firstName: true, lastName: true, gradeLevel: true } },
        assessment: { select: { id: true, title: true, level: true, passMark: true } },
      },
    });
  }

  async getAttemptForAdmin(attemptId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: true,
        user: { select: USER_BRIEF },
        assessment: { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt; // includes the answer key, for ADMIN only
  }

  async adminReviewAttempt(attemptId: string, adminId: string, dto: ReviewAttemptDto) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('This attempt has not been submitted yet');
    }

    const score = dto.score ?? attempt.score ?? 0;
    const passed = score >= attempt.assessment.passMark;

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        score,
        passed,
        scoreVisibleToUser: attempt.assessment.audience === AssessmentAudience.STUDENT,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });

    return this.getAttemptForAdmin(attemptId);
  }
}