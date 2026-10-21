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

  async notifyParentsPasswordChanged(studentId: string, how: 'RESET' | 'CHANGED'): Promise<void> {
    try {
      const links = await this.prisma.parentStudent.findMany({
        where: { studentId },
        select: {
          parent:  { select: { id: true, pushToken: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      });
      if (links.length === 0) return;

      const when = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      for (const link of links) {
        const name  = `${link.student.firstName} ${link.student.lastName}`;
        const title = 'Password Updated';
        const body  = how === 'RESET'
          ? `${name}'s account password was reset by the school administrator on ${when}. If you did not expect this, please contact the school.`
          : `${name} changed their account password on ${when}. If you did not expect this, please contact the school.`;

        await this.prisma.notification.create({
          data: {
            userId:  link.parent.id,
            type:    NotificationType.SYSTEM,
            message: body,
            status:  NotificationStatus.UNREAD,
          },
        });

        if (link.parent.pushToken) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: link.parent.pushToken, title, body,
              data: { type: 'SYSTEM', studentId },
              sound: 'default', priority: 'high',
            }),
          }).catch((e) => console.error('Password push failed:', e));
        }
      }
    } catch (err) {
      console.error('notifyParentsPasswordChanged failed:', err);
    }
  }

  async notifyParentManualMark(studentId: string, action: 'CHECK_IN' | 'CHECK_OUT', by: 'GUARD' | 'ADMIN'): Promise<void> {
    try {
      const links = await this.prisma.parentStudent.findMany({
        where: { studentId },
        select: {
          parent:  { select: { id: true, pushToken: true } },
          student: { select: { firstName: true } },
        },
      });
      const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
      for (const link of links) {
        const title = action === 'CHECK_IN' ? 'Student Arrived' : 'Student Left School';
        const body =
          link.student.firstName + ' was ' + (action === 'CHECK_IN' ? 'checked in' : 'checked out') +
          ' at ' + time + ' by ' + (by === 'GUARD' ? 'the school guard' : 'the school office') + ' (card not used).';
        await this.prisma.notification.create({
          data: {
            userId:  link.parent.id,
            type:    NotificationType.ATTENDANCE,
            message: body,
            status:  NotificationStatus.UNREAD,
          },
        });
        if (link.parent.pushToken) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: link.parent.pushToken, title, body,
              data: { type: 'ATTENDANCE', studentId },
              sound: 'default', priority: 'high',
            }),
          }).catch((e) => console.error('Manual mark push failed:', e));
        }
      }
    } catch (err) {
      console.error('notifyParentManualMark failed:', err);
    }
  }

  async notifyParentCardEvent(studentId: string, kind: 'LOST' | 'SUSPENDED' | 'REACTIVATED' | 'REPLACED'): Promise<void> {
    try {
      const links = await this.prisma.parentStudent.findMany({
        where: { studentId },
        select: {
          parent:  { select: { id: true, pushToken: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      });
      for (const link of links) {
        const name = link.student.firstName + ' ' + link.student.lastName;
        const title = 'RFID Card Update';
        const body =
          kind === 'LOST'
            ? name + "'s RFID card was reported lost and is now blocked. Please contact the school for a replacement."
            : kind === 'SUSPENDED'
              ? name + "'s RFID card was suspended. It cannot be used until the school reactivates it."
              : kind === 'REACTIVATED'
                ? name + "'s RFID card is active again."
                : name + ' has a new RFID card. The old card no longer works.';
        await this.prisma.notification.create({
          data: {
            userId:  link.parent.id,
            type:    NotificationType.SYSTEM,
            message: body,
            status:  NotificationStatus.UNREAD,
          },
        });
        if (link.parent.pushToken) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: link.parent.pushToken, title, body,
              data: { type: 'SYSTEM', studentId },
              sound: 'default', priority: 'high',
            }),
          }).catch((e) => console.error('Card update push failed:', e));
        }
      }
    } catch (err) {
      console.error('notifyParentCardEvent failed:', err);
    }
  }

  async notifyParentBlockedCardTap(studentId: string, kind: 'LOST' | 'SUSPENDED' | 'RETIRED'): Promise<void> {
    try {
      const links = await this.prisma.parentStudent.findMany({
        where: { studentId },
        select: {
          parent:  { select: { id: true, pushToken: true } },
          student: { select: { firstName: true, lastName: true } },
        },
      });
      if (links.length === 0) return;

      const since = new Date(Date.now() - 10 * 60 * 1000);
      const time = new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });
      const state = kind === 'SUSPENDED' ? 'suspended' : kind === 'LOST' ? 'reported lost' : 'replaced';

      for (const link of links) {
        const name = link.student.firstName + ' ' + link.student.lastName;
        // At most one alert per 10 minutes so repeated taps do not spam the parent.
        const recent = await this.prisma.notification.findFirst({
          where: {
            userId: link.parent.id,
            type: NotificationType.SYSTEM,
            sentAt: { gte: since },
            message: { startsWith: name + "'s card" },
          },
          select: { id: true },
        });
        if (recent) continue;

        const title = 'Card Alert';
        const body = name + "'s card (" + state + ') was tapped at the gate at ' + time + '. Please contact the school.';
        await this.prisma.notification.create({
          data: {
            userId:  link.parent.id,
            type:    NotificationType.SYSTEM,
            message: body,
            status:  NotificationStatus.UNREAD,
          },
        });
        if (link.parent.pushToken) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: link.parent.pushToken, title, body,
              data: { type: 'SYSTEM', studentId },
              sound: 'default', priority: 'high',
            }),
          }).catch((e) => console.error('Card alert push failed:', e));
        }
      }
    } catch (err) {
      console.error('notifyParentBlockedCardTap failed:', err);
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