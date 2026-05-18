import { Controller, Get, Query } from '@nestjs/common';
import { AppConfigService } from './config.service';

@Controller('config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  async getConfig(@Query('group') group?: string) {
    if (group) {
      return this.appConfigService.getByGroup(group);
    }
    return this.appConfigService.getAll();
  }
}