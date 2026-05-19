import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('config')
@UseGuards(JwtAuthGuard)   // Must be logged in — but any role can read config
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  async getConfig(@Query('group') group?: string) {
    if (group) return this.appConfigService.getByGroup(group);
    return this.appConfigService.getAll();
  }
}