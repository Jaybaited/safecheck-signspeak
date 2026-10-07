import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NetworkTimeService } from '../common/services/network-time.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

type AttendanceAction = 'CHECK_IN' | 'CHECK_OUT';

export interface RfidTapResult {
  success: boolean;
  action: AttendanceAction;
  student: {
    firstName: string;
    lastName: string;
    gradeLevel: string | null;
  };
  attendance: {
    timeIn: Date | null;
    timeOut: Date | null;
    status: string | null;
  };
}

/** Returns { todayStart, todayEnd } in UTC representing Manila "today" */
function getManilaToday(manilaDate: Date): { todayStart: Date; todayEnd: Date } {
  const y = manilaDate.getUTCFullYear();
  const m = String(manilaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(manilaDate.getUTCDate()).padStart(2, '0');
  const todayStart = new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  return { todayStart, todayEnd };
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly networkTime: NetworkTimeService,
  ) {}

  async handleRfidTap(rfidCard: string): Promise<RfidTapResult> {
    const user = await this.prisma.user.findUnique({
      where: { rfidCard },
      select: {
        id:         true,
        firstName:  true,
        lastName:   true,
        gradeLevel: true,
        role:       true,
      },
    });

    if (!user) throw new NotFoundException('RFID card not registered');
    if (user.role !== 'STUDENT')
      throw new NotFoundException('Only students can use attendance system');

    const serverNow = await this.networkTime.getNow();

    const manilaOffset = 8 * 60;
    const manilaMs     = serverNow.getTime() + manilaOffset * 60 * 1000;
    const manilaDate   = new Date(manilaMs);

    const { todayStart: attendanceDate, todayEnd: attendanceDateNext } =
      getManilaToday(manilaDate);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: user.id,
        date: { gte: attendanceDate, lt: attendanceDateNext },
      },
    });

    const manilaHour   = manilaDate.getUTCHours();
    const manilaMinute = manilaDate.getUTCMinutes();
    const isLate       = manilaHour > 8 || (manilaHour === 8 && manilaMinute > 0);
    const status       = isLate ? 'LATE' : 'PRESENT';

    let attendance = existingAttendance;
    let action: AttendanceAction;

    if (!attendance) {
      try {
        attendance = await this.prisma.attendance.create({
          data: {
            studentId: user.id,
            timeIn:    serverNow,
            date:      attendanceDate,
            status,
          },
        });
      } catch (err: any) {
        // Two taps for the same card arrived at the same moment (unique student + date).
        if (err?.code === 'P2002') {
          throw new ConflictException('This card was just scanned. Please wait a moment and tap again.');
        }
        throw err;
      }
      action = 'CHECK_IN';
    } else if (!attendance.timeOut) {
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data:  { timeOut: serverNow },
      });
      action = 'CHECK_OUT';
    } else {
      throw new NotFoundException(
        `${user.firstName} has already checked in and out for today.`,
      );
    }

    this.notificationsService
      .notifyParentOnRFID(
        user.id,
        action === 'CHECK_IN' ? 'RFID_ENTRY' : 'RFID_EXIT',
      )
      .catch(console.error);

    return {
      success: true,
      action,
      student: {
        firstName:  user.firstName,
        lastName:   user.lastName,
        gradeLevel: user.gradeLevel,
      },
      attendance: {
        timeIn:  attendance.timeIn,
        timeOut: attendance.timeOut,
        status:  attendance.status,
      },
    };
  }

  async getStudentAttendance(studentId: string, from?: string, to?: string) {
    // With from/to (YYYY-MM-DD) return every record in that range; otherwise the latest 30.
    if (from || to) {
      const valid = (v?: string) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
      if (!valid(from) || !valid(to)) {
        throw new BadRequestException('from and to must be dates like 2026-09-30.');
      }
      const date: { gte?: Date; lte?: Date } = {};
      if (from) date.gte = new Date(from + 'T00:00:00.000Z');
      if (to) date.lte = new Date(to + 'T00:00:00.000Z');
      return this.prisma.attendance.findMany({
        where:   { studentId, date },
        orderBy: { date: 'desc' },
        take:    400,
      });
    }
    return this.prisma.attendance.findMany({
      where:   { studentId },
      orderBy: { date: 'desc' },
      take:    30,
    });
  }

  async getStudentStats(studentId: string) {
    const serverNow = await this.networkTime.getNow();
    const manilaNow = new Date(serverNow.getTime() + 8 * 60 * 60 * 1000);
    const todayMs   = Date.UTC(manilaNow.getUTCFullYear(), manilaNow.getUTCMonth(), manilaNow.getUTCDate());
    const DAY       = 24 * 60 * 60 * 1000;

    const records = await this.prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: new Date(todayMs - 29 * DAY), lte: new Date(todayMs) },
      },
      orderBy: { date: 'asc' },
    });

    const present = records.filter((r) => r.timeIn !== null).length;
    const late    = records.filter((r) => r.status === 'LATE').length;

    // School days = Monday to Friday from the student's first record in the window up to
    // yesterday, plus today if the student has already tapped. Holidays are not known.
    let schoolDays = 0;
    if (records.length > 0) {
      for (let t = records[0].date.getTime(); t < todayMs; t += DAY) {
        const dow = new Date(t).getUTCDay();
        if (dow !== 0 && dow !== 6) schoolDays++;
      }
      if (records.some((r) => r.date.getTime() === todayMs)) schoolDays++;
    }

    const totalDays      = Math.max(schoolDays, present);
    const absent         = Math.max(0, totalDays - present);
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return { totalDays, present, late, absent, attendanceRate };
  }

  async getTodayAttendance(studentId: string) {
    // Same Manila "today" as the RFID tap, so the result does not depend on the server time zone.
    const serverNow  = await this.networkTime.getNow();
    const manilaDate = new Date(serverNow.getTime() + 8 * 60 * 60 * 1000);
    const { todayStart, todayEnd } = getManilaToday(manilaDate);

    return this.prisma.attendance.findFirst({
      where: {
        studentId,
        date: { gte: todayStart, lt: todayEnd },
      },
    });
  }

  async getTodaySummary() {
    const serverNow  = await this.networkTime.getNow();
    const manilaDate = new Date(serverNow.getTime() + 8 * 60 * 60 * 1000);
    const { todayStart, todayEnd } = getManilaToday(manilaDate);

    const [totalStudents, records] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.attendance.findMany({
        where: { date: { gte: todayStart, lt: todayEnd } },
        select: { status: true, timeIn: true, timeOut: true },
      }),
    ]);

    const checkedIn = records.filter((r) => r.timeIn !== null);
    const late = checkedIn.filter((r) => r.status === 'LATE').length;
    const unconfirmedOut = checkedIn.filter((r) => r.status === 'UNCONFIRMED_OUT').length;

    return {
      date: todayStart.toISOString().slice(0, 10),
      lastTapAt: records.reduce<Date | null>((latest, r) => {
        for (const t of [r.timeIn, r.timeOut]) {
          if (t && (!latest || t > latest)) latest = t;
        }
        return latest;
      }, null),
      totalStudents,
      checkedIn: checkedIn.length,
      late,
      unconfirmedOut,
      notCheckedIn: Math.max(0, totalStudents - checkedIn.length),
      attendanceRate: totalStudents > 0 ? Math.round((checkedIn.length / totalStudents) * 100) : 0,
    };
  }

  async getNetworkTime(): Promise<Date> {
    return this.networkTime.getNow();
  }

  // ── Item 14: Cron — runs every day at 6:00 PM Manila time ─────────────────
  // FIX: uses NetworkTimeService (Manila-correct) instead of raw new Date() (UTC)
  @Cron('0 18 * * *', { timeZone: 'Asia/Manila' })
  async markNoTapOutStudents() {
    const serverNow  = await this.networkTime.getNow();
    const manilaMs   = serverNow.getTime() + 8 * 60 * 60 * 1000;
    const manilaDate = new Date(manilaMs);

    const { todayStart, todayEnd } = getManilaToday(manilaDate);

    const noTapOut = await this.prisma.attendance.findMany({
      where: {
        date:    { gte: todayStart, lt: todayEnd },
        timeIn:  { not: null },
        timeOut: null,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    for (const record of noTapOut) {
      await this.prisma.attendance.update({
        where: { id: record.id },
        data:  { status: 'UNCONFIRMED_OUT' },
      });

      this.notificationsService
        .notifyParentOnRFID(record.studentId, 'RFID_NO_TIMEOUT')
        .catch(console.error);
    }

    console.log(`[Item 14] Marked ${noTapOut.length} students as UNCONFIRMED_OUT`);
  }

  // ── Item 14: Returns students with timeIn but no timeOut today ────────────
  // FIX: uses NetworkTimeService for Manila-correct date range
  async getNoTapOutStudents() {
    const serverNow  = await this.networkTime.getNow();
    const manilaMs   = serverNow.getTime() + 8 * 60 * 60 * 1000;
    const manilaDate = new Date(manilaMs);

    const { todayStart, todayEnd } = getManilaToday(manilaDate);

    return this.prisma.attendance.findMany({
      where: {
        date:    { gte: todayStart, lt: todayEnd },
        timeIn:  { not: null },
        timeOut: null,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, gradeLevel: true },
        },
      },
      orderBy: { timeIn: 'asc' },
    });
  }

  // ── Revision 16: Filtered attendance for Teacher/Admin portal ─────────────
  async getFilteredAttendance(query: AttendanceQueryDto) {
    const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip  = (page - 1) * limit;

    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    if (query.date) {
      const exact = new Date(`${query.date}T00:00:00.000Z`);
      dateFilter  = { gte: exact, lt: new Date(exact.getTime() + 86_400_000) };
    } else if (query.dateFrom || query.dateTo) {
      dateFilter = {};
      if (query.dateFrom) dateFilter.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
      if (query.dateTo)
        dateFilter.lt = new Date(
          new Date(`${query.dateTo}T00:00:00.000Z`).getTime() + 86_400_000,
        );
    }

    const where: Record<string, unknown> = {};
    if (query.studentId)  where.studentId = query.studentId;
    if (dateFilter)       where.date      = dateFilter;
    if (query.status)     where.status    = query.status;
    if (query.gradeLevel) where.student   = { gradeLevel: query.gradeLevel };

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: [{ date: 'desc' }, { timeIn: 'desc' }],
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id:         true,
              firstName:  true,
              lastName:   true,
              gradeLevel: true,
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data:       records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}