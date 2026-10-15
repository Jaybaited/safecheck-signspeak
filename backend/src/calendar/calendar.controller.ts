import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CalendarService } from './calendar.service';
import { CreateHolidayDto } from './dto/calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('holidays')
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT')
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.calendar.list(from, to);
  }

  @Post('holidays')
  @Roles('ADMIN')
  create(@Body() dto: CreateHolidayDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.calendar.create(dto.date, dto.name, adminId);
  }

  @Delete('holidays/:id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.calendar.remove(id, adminId);
  }
}