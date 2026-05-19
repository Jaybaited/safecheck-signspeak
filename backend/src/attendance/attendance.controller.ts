import {
  Controller, Get, Post, Body, Param,
  BadRequestException, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

export class RfidTapDto {
  @IsString()
  @IsNotEmpty()
  rfidCard: string;
}

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ✅ Intentionally public — called by RFID hardware device
  @Post('rfid-tap')
  async handleRfidTap(@Body() body: RfidTapDto) {
    if (!body.rfidCard) throw new BadRequestException('rfidCard is required');
    return this.attendanceService.handleRfidTap(body.rfidCard);
  }

  // ✅ Intentionally public — demo/debug for panelists
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

  // ── Item 14: Students who tapped in but never tapped out today ────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('no-tap-out')
  async getNoTapOutStudents() {
    return this.attendanceService.getNoTapOutStudents();
  }
}