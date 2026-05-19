import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus, NotificationType } from '@prisma/client';

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
          type: NotificationType.ATTENDANCE,
          message: body,
          status: NotificationStatus.UNREAD,
        },
      });
    } catch (error) {
      console.error('❌ Push notification failed:', error);
      await this.prisma.notification.create({
        data: {
          userId: data?.parentId ?? '',
          type: NotificationType.ATTENDANCE,
          message: body,
          status: NotificationStatus.UNREAD,
        },
      });
    }
  }

  async notifyParentOnRFID(
  studentId: string,
  type: 'RFID_ENTRY' | 'RFID_EXIT' | 'RFID_NO_TIMEOUT',  // ← added
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

  // ── Item 14: added RFID_NO_TIMEOUT case ──────────────────────────────────
  let title: string;
  let body: string;

  if (type === 'RFID_ENTRY') {
    title = '🏫 Student Arrived';
    body  = `${studentName} has entered the school at ${time}`;
  } else if (type === 'RFID_EXIT') {
    title = '🏠 Student Left School';
    body  = `${studentName} has left the school at ${time}`;
  } else {
    title = '⚠️ No Tap-Out Recorded';
    body  = `${studentName} has not tapped out today. Please verify their whereabouts.`;
  }

  console.log('📨 Notification title:', title);
  console.log('📨 Notification body:', body);

  if (parentLink.parent.pushToken) {
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
    console.warn(`⚠️ No push token for parent — saving to DB only`);
    await this.prisma.notification.create({
      data: {
        userId: parentLink.parent.id,
        type: NotificationType.ATTENDANCE,
        message: body,
        status: NotificationStatus.UNREAD,
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
      where: { userId, status: NotificationStatus.UNREAD },
      orderBy: { sentAt: 'desc' },
      take: 50,
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
      where: { userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ },
    });
    return { success: true };
  }

  async markOneRead(notificationId: string) {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.READ },
    });
    return { success: true };
  }
}