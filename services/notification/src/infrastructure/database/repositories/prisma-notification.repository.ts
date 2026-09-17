import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateNotificationData,
  ListNotificationsOptions,
  NotificationRepository,
  RecordSendData,
} from "../../../domain/notification/notification.repository.js";
import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from "../../../domain/notification/notification.types.js";

const safeNotificationSelect = {
  id: true,
  userId: true,
  channel: true,
  recipient: true,
  title: true,
  body: true,
  status: true,
  metadata: true,
  providerReference: true,
  failureReason: true,
  sentAt: true,
  failedAt: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = {
  id: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string | null;
  title: string;
  body: string;
  status: NotificationStatus;
  metadata: Prisma.JsonValue | null;
  providerReference: string | null;
  failureReason: string | null;
  sentAt: Date | null;
  failedAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    channel: row.channel,
    recipient: row.recipient,
    title: row.title,
    body: row.body,
    status: row.status,
    metadata: row.metadata as Record<string, unknown> | null,
    providerReference: row.providerReference,
    failureReason: row.failureReason,
    sentAt: row.sentAt,
    failedAt: row.failedAt,
    readAt: row.readAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = await this.db.notification.create({
      data: {
        userId: data.userId,
        channel: data.channel,
        recipient: data.recipient,
        title: data.title,
        body: data.body,
        metadata: data.metadata === null ? Prisma.JsonNull : (data.metadata as Prisma.InputJsonValue),
      },
      select: safeNotificationSelect,
    });

    return toNotification(notification);
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.db.notification.findUnique({
      where: { id },
      select: safeNotificationSelect,
    });

    return notification ? toNotification(notification) : null;
  }

  async listByUserId(
    userId: string,
    options?: ListNotificationsOptions,
  ): Promise<Notification[]> {
    const notifications = await this.db.notification.findMany({
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: safeNotificationSelect,
    });

    return notifications.map(toNotification);
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const result = await this.db.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findById(id);
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  async recordSend(id: string, data: RecordSendData): Promise<Notification | null> {
    const result = await this.db.notification.updateMany({
      where: { id, status: "pending" },
      data: {
        status: data.status,
        providerReference: data.providerReference,
        failureReason: data.failureReason,
        ...(data.status === "sent"
          ? { sentAt: new Date(), failedAt: null }
          : { sentAt: null, failedAt: new Date() }),
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findById(id);
  }
}