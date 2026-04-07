import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @UseGuards(AuthGuard('jwt'))
  async registerToken(
    @Body('pushToken') pushToken: string,
    @Req() req: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.savePushToken(userId, pushToken);
  }

  @Get('my-notifications')
  @UseGuards(AuthGuard('jwt'))
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getMyNotifications(userId);
  }
}
