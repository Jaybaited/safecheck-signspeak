import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('rfid-tap')
  async handleRfidTap(@Body() body: { rfidCard: string }) {
    return this.attendanceService.handleRfidTap(body.rfidCard);
  }

  @Get('student/:studentId')
  async getStudentAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendance(studentId);
  }

  @Get('student/:studentId/stats')
  async getStudentStats(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentStats(studentId);
  }

  @Get('student/:studentId/today')
  async getTodayAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getTodayAttendance(studentId);
  }
}
