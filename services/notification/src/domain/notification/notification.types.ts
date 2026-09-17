export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export type NotificationStatus = "pending" | "sent" | "failed";

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string | null;
  title: string;
  body: string;
  status: NotificationStatus;
  metadata: Record<string, unknown> | null;
  providerReference: string | null;
  failureReason: string | null;
  sentAt: Date | null;
  failedAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}