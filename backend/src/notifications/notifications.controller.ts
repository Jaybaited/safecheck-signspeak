import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── Mobile: register Expo push token ────────────────────────────────────
  @Post('register-token')
  @UseGuards(AuthGuard('jwt'))
  async registerToken(
    @Body('pushToken') pushToken: string,
    @Req() req: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.savePushToken(userId, pushToken);
  }

  // ─── Get all notifications (read + unread) ────────────────────────────────
  @Get('my-notifications')
  @UseGuards(AuthGuard('jwt'))
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getMyNotifications(userId);
  }

  // ─── Get only unread (used by web polling hook for badge + toast) ─────────
  @Get('unread')
  @UseGuards(AuthGuard('jwt'))
  async getUnread(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getUnreadNotifications(userId);
  }

  // ─── Mark all notifications as read ──────────────────────────────────────
  @Patch('mark-all-read')
  @UseGuards(AuthGuard('jwt'))
  async markAllRead(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.markAllRead(userId);
  }

  // ─── Mark one notification as read ───────────────────────────────────────
  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  async markOneRead(@Param('id') id: string) {
    return this.notificationsService.markOneRead(id);
  }

  // ─── Get ALL notifications (history page) ────────────────────────────────
  @Get('all')
  @UseGuards(AuthGuard('jwt'))
  async getAll(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getAllNotifications(userId);
  }
}