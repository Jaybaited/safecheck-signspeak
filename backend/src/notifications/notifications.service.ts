import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

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
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    };

    try {
      console.log('📤 Sending push notification to:', pushToken);
      await axios.post('https://exp.host/--/api/v2/push/send', message, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ Push notification sent successfully');

      await this.prisma.notification.create({
        data: {
          userId: data?.parentId ?? '',
          type: 'PUSH',
          message: body,
          status: 'SENT',
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

    if (!parentLink?.parent?.pushToken) {
      console.warn(`⚠️ No push token found for parent of student ${studentId}`);
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
  }

  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }
}
