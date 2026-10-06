import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FSLActivitySource, FSLCategory, FSLProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, assertCanAccessStudent } from '../common/access.util';
import { ImportProgressDto, RecordGameDto, RecordSignDto } from './dto/fsl.dto';

const MASTER_CONFIDENCE = 0.75;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function manilaDateKey(d: Date): string {
  return new Date(d.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

// Monday to Sunday of the current week in Manila time.
function currentWeek(): { dates: string[]; startUtc: Date } {
  const nowManila = new Date(Date.now() + MANILA_OFFSET_MS);
  const dow = (nowManila.getUTCDay() + 6) % 7;
  const monday = Date.UTC(
    nowManila.getUTCFullYear(),
    nowManila.getUTCMonth(),
    nowManila.getUTCDate() - dow,
  );
  const dates = Array.from({ length: 7 }, (_, i) =>
    new Date(monday + i * DAY_MS).toISOString().slice(0, 10),
  );
  return { dates, startUtc: new Date(monday - MANILA_OFFSET_MS) };
}

@Injectable()
export class FslService {
  constructor(private readonly prisma: PrismaService) {}

  private staticLetters() {
    return this.prisma.fSLWord.findMany({
      where: { category: FSLCategory.ALPHABET, isDynamic: false },
      orderBy: { word: 'asc' },
    });
  }

  listWords() {
    return this.prisma.fSLWord.findMany({
      orderBy: [{ category: 'asc' }, { word: 'asc' }],
      select: { id: true, word: true, category: true, isDynamic: true, videoUrl: true },
    });
  }

  async getProgressFor(user: AuthUser, studentId: string) {
    await assertCanAccessStudent(this.prisma, user, studentId);
    return this.getProgress(studentId);
  }

  async getProgress(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== 'STUDENT') throw new NotFoundException('Student not found.');

    const letters = await this.staticLetters();
    const rows = await this.prisma.fSLProgress.findMany({
      where: { studentId, wordId: { in: letters.map((l) => l.id) } },
    });
    const byWord = new Map(rows.map((r) => [r.wordId, r]));

    const week = currentWeek();
    const activity = await this.prisma.fSLActivity.findMany({
      where: { studentId, createdAt: { gte: week.startUtc } },
      select: { createdAt: true },
    });
    const counts = new Map<string, number>();
    for (const a of activity) {
      const k = manilaDateKey(a.createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const daily = week.dates.map((date) => ({ date, count: counts.get(date) ?? 0 }));

    const best = await this.prisma.fSLGameScore.aggregate({
      where: { studentId },
      _max: { score: true },
    });

    const items = letters.map((l) => {
      const p = byWord.get(l.id);
      return {
        word: l.word,
        status: p?.status ?? FSLProgressStatus.NOT_STARTED,
        attempts: p?.attempts ?? 0,
        accuracy: p?.accuracy ?? 0,
        lastPracticed: p?.lastPracticed ?? null,
      };
    });
    const masteredCount = items.filter((i) => i.status === FSLProgressStatus.MASTERED).length;
    let lastPracticed: Date | null = null;
    for (const i of items) {
      if (i.lastPracticed && (!lastPracticed || i.lastPracticed > lastPracticed)) {
        lastPracticed = i.lastPracticed;
      }
    }

    return {
      studentId,
      totalLetters: items.length,
      masteredCount,
      percent: items.length ? Math.round((masteredCount / items.length) * 100) : 0,
      letters: items,
      daily,
      weekTotal: daily.reduce((s, d) => s + d.count, 0),
      highScore: best._max.score ?? 0,
      lastPracticed,
    };
  }

  async recordSign(studentId: string, dto: RecordSignDto) {
    const word = await this.prisma.fSLWord.findUnique({
      where: { word: dto.word.trim().toUpperCase() },
    });
    if (!word || word.category !== FSLCategory.ALPHABET || word.isDynamic) {
      throw new BadRequestException('Only static alphabet letters can be recorded right now.');
    }
    const reached = dto.confidence >= MASTER_CONFIDENCE;
    const source = dto.source === 'GAME' ? FSLActivitySource.GAME : FSLActivitySource.PRACTICE;

    return this.prisma.$transaction(async (tx) => {
      await tx.fSLActivity.create({
        data: { studentId, wordId: word.id, source, confidence: dto.confidence },
      });
      const key = { studentId_wordId: { studentId, wordId: word.id } };
      const existing = await tx.fSLProgress.findUnique({ where: key });
      const prevAttempts = existing?.attempts ?? 0;
      const attempts = prevAttempts + 1;
      // accuracy = average confidence of the recorded correct signs
      const accuracy = ((existing?.accuracy ?? 0) * prevAttempts + dto.confidence) / attempts;
      const wasMastered = existing?.status === FSLProgressStatus.MASTERED;
      const status =
        wasMastered || reached ? FSLProgressStatus.MASTERED : FSLProgressStatus.IN_PROGRESS;
      const saved = await tx.fSLProgress.upsert({
        where: key,
        create: { studentId, wordId: word.id, attempts, accuracy, status, lastPracticed: new Date() },
        update: { attempts, accuracy, status, lastPracticed: new Date() },
      });
      return {
        word: word.word,
        status: saved.status,
        attempts: saved.attempts,
        accuracy: saved.accuracy,
        newlyMastered: !wasMastered && saved.status === FSLProgressStatus.MASTERED,
      };
    });
  }

  async recordGame(studentId: string, dto: RecordGameDto) {
    const before = await this.prisma.fSLGameScore.aggregate({
      where: { studentId },
      _max: { score: true },
    });
    const previousBest = before._max.score ?? 0;
    await this.prisma.fSLGameScore.create({
      data: { studentId, mode: dto.mode, score: dto.score, lettersCount: dto.lettersCount },
    });
    return {
      score: dto.score,
      best: Math.max(previousBest, dto.score),
      isNewBest: dto.score > previousBest,
    };
  }

  // One-time import of progress that older versions kept in the browser.
  async importLocal(studentId: string, dto: ImportProgressDto) {
    const letters = await this.staticLetters();
    const idByWord = new Map(letters.map((l) => [l.word, l.id]));
    const wantedIds = [...new Set(dto.letters.map((l) => l.trim().toUpperCase()))]
      .filter((l) => idByWord.has(l))
      .map((l) => idByWord.get(l)!);

    let imported = 0;
    if (wantedIds.length) {
      const existing = await this.prisma.fSLProgress.findMany({
        where: { studentId, wordId: { in: wantedIds } },
        select: { wordId: true },
      });
      const have = new Set(existing.map((e) => e.wordId));
      const toCreate = wantedIds
        .filter((id) => !have.has(id))
        .map((wordId) => ({
          studentId, wordId, status: FSLProgressStatus.MASTERED, attempts: 0, accuracy: 0,
        }));
      if (toCreate.length) {
        await this.prisma.fSLProgress.createMany({ data: toCreate, skipDuplicates: true });
      }
      imported = toCreate.length;
      await this.prisma.fSLProgress.updateMany({
        where: { studentId, wordId: { in: wantedIds }, status: { not: FSLProgressStatus.MASTERED } },
        data: { status: FSLProgressStatus.MASTERED },
      });
    }

    let highScoreImported = false;
    if (dto.highScore && dto.highScore > 0) {
      const best = await this.prisma.fSLGameScore.aggregate({
        where: { studentId },
        _max: { score: true },
      });
      if ((best._max.score ?? 0) < dto.highScore) {
        await this.prisma.fSLGameScore.create({
          data: { studentId, mode: 'IMPORTED', score: dto.highScore, lettersCount: 0 },
        });
        highScoreImported = true;
      }
    }
    return { imported, highScoreImported };
  }

  // Admin and teacher list: one row per student.
  async overview() {
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true, gradeLevel: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    const letters = await this.staticLetters();
    const ids = letters.map((l) => l.id);
    const week = currentWeek();

    const [mastered, practiced, weekly, scores] = await Promise.all([
      this.prisma.fSLProgress.groupBy({
        by: ['studentId'],
        where: { status: FSLProgressStatus.MASTERED, wordId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.fSLProgress.groupBy({
        by: ['studentId'],
        where: { wordId: { in: ids } },
        _max: { lastPracticed: true },
      }),
      this.prisma.fSLActivity.groupBy({
        by: ['studentId'],
        where: { createdAt: { gte: week.startUtc } },
        _count: { _all: true },
      }),
      this.prisma.fSLGameScore.groupBy({
        by: ['studentId'],
        _max: { score: true },
      }),
    ]);

    const m = new Map(mastered.map((r) => [r.studentId, r._count._all]));
    const p = new Map(practiced.map((r) => [r.studentId, r._max.lastPracticed]));
    const w = new Map(weekly.map((r) => [r.studentId, r._count._all]));
    const s = new Map(scores.map((r) => [r.studentId, r._max.score]));

    return students.map((st) => {
      const masteredCount = m.get(st.id) ?? 0;
      return {
        ...st,
        totalLetters: letters.length,
        masteredCount,
        percent: letters.length ? Math.round((masteredCount / letters.length) * 100) : 0,
        lastPracticed: p.get(st.id) ?? null,
        weekCount: w.get(st.id) ?? 0,
        highScore: s.get(st.id) ?? 0,
      };
    });
  }
}