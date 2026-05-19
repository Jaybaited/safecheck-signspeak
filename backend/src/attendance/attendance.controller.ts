import {
  Controller, Get, Post, Body, Param,
  Query, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { RfidTapDto } from './dto/rfid-tap.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ✅ Intentionally public — called by RFID hardware device
  @Post('rfid-tap')
  async handleRfidTap(@Body() body: RfidTapDto) {
    return this.attendanceService.handleRfidTap(body.rfidCard);
  }

  // ✅ Intentionally public — demo/debug for panelists
  @Get('network-time')
  async getNetworkTime() {
    const networkTime = await this.attendanceService.getNetworkTime();
    return {
      networkTime:     networkTime.toISOString(),
      serverLocalTime: new Date().toISOString(),
      source:          'timeapi.io (Asia/Manila)',
      note:            'Attendance timestamps use networkTime — immune to local clock tampering',
    };
  }

  // ── Revision 16: Filtered attendance — ADMIN + TEACHER only ──────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get()
  async getFilteredAttendance(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.getFilteredAttendance(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId')
  async getStudentAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendance(studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId/stats')
  async getStudentStats(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentStats(studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId/today')
  async getTodayAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getTodayAttendance(studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('no-tap-out')
  async getNoTapOutStudents() {
    return this.attendanceService.getNoTapOutStudents();
  }
}