import type { Notification, NotificationChannel, NotificationStatus } from "./notification.types.js";

export interface CreateNotificationData {
  userId: string;
  channel: NotificationChannel;
  recipient: string | null;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
}

export interface RecordSendData {
  status: NotificationStatus;
  providerReference: string | null;
  failureReason: string | null;
}

export interface ListNotificationsOptions {
  status?: NotificationStatus;
}

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  listByUserId(userId: string, options?: ListNotificationsOptions): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  recordSend(id: string, data: RecordSendData): Promise<Notification | null>;
}