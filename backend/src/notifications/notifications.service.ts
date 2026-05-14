import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async savePushToken(userId: string, pushToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
    return { success: true };
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      console.log('📤 Sending Expo push notification to:', pushToken);

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
        }),
      });

      const result = await response.json();
      console.log('✅ Expo notification result:', JSON.stringify(result));

      await this.prisma.notification.create({
        data: {
          userId: data?.parentId ?? '',
          type: 'PUSH',
          message: body,
          status: 'unread',
        },
      });
    } catch (error) {
      console.error('❌ Push notification failed:', error);
      await this.prisma.notification.create({
        data: {
          userId: data?.parentId ?? '',
          type: 'PUSH',
          message: body,
          status: 'FAILED',
        },
      });
    }
  }

  async notifyParentOnRFID(
    studentId: string,
    type: 'RFID_ENTRY' | 'RFID_EXIT',
  ) {
    console.log('🔔 notifyParentOnRFID called for studentId:', studentId);

    const parentLink = await this.prisma.parentStudent.findFirst({
      where: { studentId },
      include: {
        parent: {
          select: {
            id: true,
            pushToken: true,
            firstName: true,
          },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('👨‍👦 parentLink found:', JSON.stringify(parentLink));

    if (!parentLink) {
      console.warn(`⚠️ No parent link found for student ${studentId}`);
      return;
    }

    const studentName = `${parentLink.student.firstName} ${parentLink.student.lastName}`;
    const time = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isEntry = type === 'RFID_ENTRY';
    const title = isEntry ? '🏫 Student Arrived' : '🏠 Student Left School';
    const body = isEntry
      ? `${studentName} has entered the school at ${time}`
      : `${studentName} has left the school at ${time}`;

    console.log('📨 Notification title:', title);
    console.log('📨 Notification body:', body);

    if (parentLink.parent.pushToken) {
      // ✅ Send Expo push notification to mobile
      await this.sendPushNotification(
        parentLink.parent.pushToken,
        title,
        body,
        {
          type,
          studentId,
          parentId: parentLink.parent.id,
        },
      );
    } else {
      // ⚠️ No push token — save to DB only so web polling can pick it up
      console.warn(`⚠️ No push token for parent — saving to DB only`);
      await this.prisma.notification.create({
        data: {
          userId: parentLink.parent.id,
          type: 'PUSH',
          message: body,
          status: 'unread',
        },
      });
    }
  }

  // ─── Web polling endpoints ────────────────────────────────────────────────

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, status: 'unread' },
      orderBy: { sentAt: 'desc' },
    });
  }

  async getAllNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, status: { in: ['unread', 'FAILED'] } },
      data: { status: 'read' },
    });
    return { success: true };
  }

  async markOneRead(notificationId: string) {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'read' },
    });
    return { success: true };
  }
}