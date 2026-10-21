import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SchoolYearDto } from './dto/school-year.dto';

@Controller('config')
@UseGuards(JwtAuthGuard)   // Must be logged in — but any role can read config
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  async getConfig(@Query('group') group?: string) {
    if (group) return this.appConfigService.getByGroup(group);
    return this.appConfigService.getAll();
  }

  // Admin only: the current school year (name, first day, last day).
  @Put('school-year')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  saveSchoolYear(@Body() body: SchoolYearDto, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.appConfigService.saveSchoolYear(body, adminId);
  }
}
