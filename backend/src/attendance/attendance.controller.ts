import {
  Controller, Get, Post, Body, Param,
  Query, Req, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { RfidTapDto } from './dto/rfid-tap.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { assertCanAccessStudent, getAuthUser } from '../common/access.util';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

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

  // ── Per-student routes: owner, linked parent, teacher, or admin only ─────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId')
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
  ) {
    await assertCanAccessStudent(this.prisma, getAuthUser(req), studentId);
    return this.attendanceService.getStudentAttendance(studentId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId/stats')
  async getStudentStats(@Param('studentId') studentId: string, @Req() req: any) {
    await assertCanAccessStudent(this.prisma, getAuthUser(req), studentId);
    return this.attendanceService.getStudentStats(studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  @Get('student/:studentId/today')
  async getTodayAttendance(@Param('studentId') studentId: string, @Req() req: any) {
    await assertCanAccessStudent(this.prisma, getAuthUser(req), studentId);
    return this.attendanceService.getTodayAttendance(studentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('summary/today')
  async getTodaySummary() {
    return this.attendanceService.getTodaySummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  @Get('no-tap-out')
  async getNoTapOutStudents() {
    return this.attendanceService.getNoTapOutStudents();
  }
}