import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { IsString, IsNotEmpty } from 'class-validator';

// ✅ Only rfidCard accepted — NO client timestamp, NO date, NO timeIn
export class RfidTapDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;
}

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * POST /attendance/rfid-tap
   * Accepts rfidCard only. All timestamps are computed server-side using network time.
   */
  @Post('rfid-tap')
  async handleRfidTap(@Body() body: RfidTapDto) {
    if (!body.rfidCard) {
      throw new BadRequestException('rfidCard is required');
    }
    return this.attendanceService.handleRfidTap(body.rfidCard);
  }

  /**
   * GET /attendance/student/:studentId
   * Returns last 30 attendance records for a student.
   */
  @Get('student/:studentId')
  async getStudentAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendance(studentId);
  }

  /**
   * GET /attendance/student/:studentId/stats
   * Returns present/late/absent/rate stats.
   */
  @Get('student/:studentId/stats')
  async getStudentStats(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentStats(studentId);
  }

  /**
   * GET /attendance/student/:studentId/today
   * Returns today's attendance record (Manila-timezone aware).
   */
  @Get('student/:studentId/today')
  async getTodayAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getTodayAttendance(studentId);
  }

  /**
   * GET /attendance/network-time
   * ✅ Demo/debug endpoint — proves the system uses real network time.
   * Shows networkTime vs serverLocalTime so panelists can verify
   * that even if the machine clock is tampered, attendance uses real time.
   */
  @Get('network-time')
  async getNetworkTime() {
    const networkTime = await this.attendanceService.getNetworkTime();
    return {
      networkTime: networkTime.toISOString(),
      serverLocalTime: new Date().toISOString(),
      source: 'timeapi.io (Asia/Manila)',
      note: 'Attendance timestamps use networkTime — immune to local clock tampering',
    };
  }
}