import { Injectable, NotFoundException } from '@nestjs/common';
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

    // ✅ Always use network time — immune to local machine clock tampering
    const serverNow = await this.networkTime.getNow();

    // Compute Manila date components from network time
    const manilaOffset = 8 * 60; // UTC+8 in minutes
    const manilaMs = serverNow.getTime() + manilaOffset * 60 * 1000;
    const manilaDate = new Date(manilaMs);

    const manilaYear  = manilaDate.getUTCFullYear();
    const manilaMonth = manilaDate.getUTCMonth();
    const manilaDay   = manilaDate.getUTCDate();

    // ✅ Store date as Manila date string at midnight UTC
    // e.g. May 18 Manila → "2026-05-18T00:00:00.000Z" → displays as 2026-05-18 in Supabase
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

    // Determine LATE: 8:00 AM Manila time and beyond
    const manilaHour   = manilaDate.getUTCHours();
    const manilaMinute = manilaDate.getUTCMinutes();
    const isLate = manilaHour > 8 || (manilaHour === 8 && manilaMinute > 0);
    const status = isLate ? 'LATE' : 'PRESENT';

    let attendance = existingAttendance;
    let action: AttendanceAction;

    if (!attendance) {
      // First tap = Check In
      attendance = await this.prisma.attendance.create({
        data: {
          studentId: user.id,
          timeIn: serverNow,
          date: attendanceDate,  // ✅ correct Manila date
          status,
        },
      });
      action = 'CHECK_IN';
    } else if (!attendance.timeOut) {
      // Second tap = Check Out
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          timeOut: serverNow,
        },
      });
      action = 'CHECK_OUT';
    } else {
      throw new NotFoundException(
        `${user.firstName} has already checked in and out for today.`,
      );
    }

    // Notify parent (fire and forget)
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

    // ✅ Use stored status — no recalculation from timeIn hours
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

  /**
   * Exposes network time for the debug/demo endpoint.
   */
  async getNetworkTime(): Promise<Date> {
    return this.networkTime.getNow();
  }
}