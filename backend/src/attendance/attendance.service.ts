import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NetworkTimeService } from '../common/services/network-time.service';

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
        id: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('RFID card not registered');
    if (user.role !== 'STUDENT')
      throw new NotFoundException('Only students can use attendance system');

    const serverNow = await this.networkTime.getNow();

    const manilaOffset = 8 * 60;
    const manilaMs = serverNow.getTime() + manilaOffset * 60 * 1000;
    const manilaDate = new Date(manilaMs);

    const manilaYear  = manilaDate.getUTCFullYear();
    const manilaMonth = manilaDate.getUTCMonth();
    const manilaDay   = manilaDate.getUTCDate();

    const attendanceDate = new Date(
      `${manilaYear}-${String(manilaMonth + 1).padStart(2, '0')}-${String(manilaDay).padStart(2, '0')}T00:00:00.000Z`,
    );
    const attendanceDateNext = new Date(
      attendanceDate.getTime() + 24 * 60 * 60 * 1000,
    );

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: user.id,
        date: {
          gte: attendanceDate,
          lt: attendanceDateNext,
        },
      },
    });

    const manilaHour   = manilaDate.getUTCHours();
    const manilaMinute = manilaDate.getUTCMinutes();
    const isLate = manilaHour > 8 || (manilaHour === 8 && manilaMinute > 0);
    const status = isLate ? 'LATE' : 'PRESENT';

    let attendance = existingAttendance;
    let action: AttendanceAction;

    if (!attendance) {
      attendance = await this.prisma.attendance.create({
        data: {
          studentId: user.id,
          timeIn: serverNow,
          date: attendanceDate,
          status,
        },
      });
      action = 'CHECK_IN';
    } else if (!attendance.timeOut) {
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: { timeOut: serverNow },
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
        firstName: user.firstName,
        lastName: user.lastName,
        gradeLevel: user.gradeLevel,
      },
      attendance: {
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        status: attendance.status,
      },
    };
  }

  async getStudentAttendance(studentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getStudentStats(studentId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { studentId, date: { gte: thirtyDaysAgo } },
    });

    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter((r) => r.timeIn !== null).length;
    const late = attendanceRecords.filter(
      (record) => record.status === 'LATE',
    ).length;
    const absent = totalDays - present;
    const attendanceRate =
      totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return { totalDays, present, late, absent, attendanceRate };
  }

  async getTodayAttendance(studentId: string) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findFirst({
      where: {
        studentId,
        date: { gte: today, lt: tomorrow },
      },
    });
  }

  async getNetworkTime(): Promise<Date> {
    return this.networkTime.getNow();
  }

  // ── Item 14: Cron — runs every day at 6:00 PM Manila time ─────────────────
  @Cron('0 18 * * *', { timeZone: 'Asia/Manila' })
  async markNoTapOutStudents() {
    const now = new Date();
    const todayStart = new Date(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T00:00:00.000Z`,
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const noTapOut = await this.prisma.attendance.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        timeIn: { not: null },
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
        data: { status: 'UNCONFIRMED_OUT' },
      });

      this.notificationsService
        .notifyParentOnRFID(record.studentId, 'RFID_NO_TIMEOUT')
        .catch(console.error);
    }

    console.log(`[Item 14] Marked ${noTapOut.length} students as UNCONFIRMED_OUT`);
  }

  // ── Item 14: Returns students with timeIn but no timeOut today ────────────
  async getNoTapOutStudents() {
    const now = new Date();
    const todayStart = new Date(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T00:00:00.000Z`,
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.attendance.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        timeIn: { not: null },
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
  async getFilteredAttendance(query: {
    studentId?:  string;
    date?:       string;
    dateFrom?:   string;
    dateTo?:     string;
    status?:     string;
    gradeLevel?: string;
    page?:       string;
    limit?:      string;
  }) {
    const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip  = (page - 1) * limit;

    let dateFilter: { gte?: Date; lt?: Date } | undefined;

    if (query.date) {
      const exact = new Date(`${query.date}T00:00:00.000Z`);
      dateFilter = { gte: exact, lt: new Date(exact.getTime() + 86400_000) };
    } else if (query.dateFrom || query.dateTo) {
      dateFilter = {};
      if (query.dateFrom) dateFilter.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
      if (query.dateTo)   dateFilter.lt  = new Date(
        new Date(`${query.dateTo}T00:00:00.000Z`).getTime() + 86400_000,
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
        orderBy: { date: 'desc' },
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