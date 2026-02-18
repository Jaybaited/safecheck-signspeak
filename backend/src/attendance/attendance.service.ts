import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AttendanceAction = 'CHECK_IN' | 'CHECK_OUT';

export interface RfidTapResult {  // ✅ EXPORTED - Controller can now import this
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
  };
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (!user) {
      throw new NotFoundException('RFID card not registered');
    }

    if (user.role !== 'STUDENT') {
      throw new NotFoundException('Only students can use attendance system');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    let attendance = existingAttendance;
    let action: AttendanceAction;

    if (!attendance) {
      attendance = await this.prisma.attendance.create({
        data: {
          studentId: user.id,
          timeIn: new Date(),
          date: today,
        },
      });
      action = 'CHECK_IN';
    } else if (!attendance.timeOut) {
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          timeOut: new Date(),
        },
      });
      action = 'CHECK_OUT';
    } else {
      throw new NotFoundException('Already checked in and out for today');  // ✅ Better error type
    }

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
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  // ✅ Optimized: Last 30 days only

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { 
        studentId,
        date: { gte: thirtyDaysAgo }
      },
    });

    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (record) => record.timeIn !== null,
    ).length;

    const late = attendanceRecords.filter((record) => {
      if (!record.timeIn) return false;
      const timeInDate = new Date(record.timeIn);
      const hours = timeInDate.getHours();
      const minutes = timeInDate.getMinutes();
      return hours > 8 || (hours === 8 && minutes > 0);
    }).length;

    const absent = totalDays - present;
    const attendanceRate =
      totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return {
      totalDays,
      present,
      late,
      absent,
      attendanceRate,
    };
  }

  async getTodayAttendance(studentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }
}
