import {
  Controller, Post, Get, Patch, Body, Param, Req, UseGuards,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Mobile: register Expo push token ────────────────────────────────────
  @Post('register-token')
  async registerToken(
    @Body('pushToken') pushToken: string,
    @Req() req: any,
  ) {
    if (typeof pushToken !== 'string' || pushToken.trim().length === 0 || pushToken.length > 255) {
      throw new BadRequestException('A valid pushToken is required.');
    }
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.savePushToken(userId, pushToken.trim());
  }

  // ─── Get all notifications (read + unread) ────────────────────────────────
  @Get('my-notifications')
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getMyNotifications(userId);
  }

  // ─── Get only unread (used by web polling hook for badge + toast) ─────────
  @Get('unread')
  async getUnread(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getUnreadNotifications(userId);
  }

  // ─── Mark all notifications as read ──────────────────────────────────────
  @Patch('mark-all-read')
  async markAllRead(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.markAllRead(userId);
  }

  // ─── Mark one notification as read (own notifications only) ──────────────
  @Patch(':id/read')
  async markOneRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    const notification = await this.prisma.notification.findUnique({
      where:  { id },
      select: { userId: true },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.notificationsService.markOneRead(id);
  }

  // ─── Get ALL notifications (history page) ────────────────────────────────
  @Get('all')
  async getAll(@Req() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.notificationsService.getAllNotifications(userId);
  }
}