import type { NotificationChannel } from "./notification.types.js";

export interface SendNotificationInput {
  userId: string;
  channel: NotificationChannel;
  recipient: string | null;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
}

export interface SendNotificationResult {
  success: boolean;
  providerReference?: string;
  failureReason?: string;
}

export interface NotificationProvider {
  send(input: SendNotificationInput): Promise<SendNotificationResult>;
}