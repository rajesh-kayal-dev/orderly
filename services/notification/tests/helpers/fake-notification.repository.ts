import type {
  CreateNotificationData,
  ListNotificationsOptions,
  NotificationRepository,
  RecordSendData,
} from "../../src/domain/notification/notification.repository.js";
import type {
  NotificationProvider,
  SendNotificationInput,
  SendNotificationResult,
} from "../../src/domain/notification/notification.provider.js";
import type { Notification } from "../../src/domain/notification/notification.types.js";

let notificationSeq = 0;

export function makeNotification(
  userId: string,
  overrides: Partial<Notification> = {},
): Notification {
  const now = new Date();
  return {
    id: overrides.id ?? `notification-${++notificationSeq}`,
    userId,
    channel: overrides.channel ?? "in_app",
    recipient: overrides.recipient ?? null,
    title: overrides.title ?? "Order update",
    body: overrides.body ?? "Your order is out for delivery",
    status: overrides.status ?? "pending",
    metadata: overrides.metadata ?? null,
    providerReference: overrides.providerReference ?? null,
    failureReason: overrides.failureReason ?? null,
    sentAt: overrides.sentAt ?? null,
    failedAt: overrides.failedAt ?? null,
    readAt: overrides.readAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export interface FakeNotificationRepositoryHandle {
  repo: NotificationRepository;
  seedNotification(notification: Notification): void;
  getNotifications(): Notification[];
}

export function createFakeNotificationRepository(): FakeNotificationRepositoryHandle {
  const notifications: Notification[] = [];

  const repo: NotificationRepository = {
    async create(data: CreateNotificationData) {
      const notification = makeNotification(data.userId, {
        channel: data.channel,
        recipient: data.recipient,
        title: data.title,
        body: data.body,
        metadata: data.metadata,
      });
      notifications.push(notification);
      return notification;
    },

    async findById(id) {
      return notifications.find((n) => n.id === id) ?? null;
    },

    async listByUserId(userId, options: ListNotificationsOptions | undefined) {
      return notifications
        .filter((n) => n.userId === userId)
        .filter((n) => (options?.status ? n.status === options.status : true))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async markRead(id, userId) {
      const idx = notifications.findIndex(
        (n) => n.id === id && n.userId === userId && n.readAt === null,
      );

      if (idx === -1) {
        return null;
      }

      const current = notifications[idx]!;
      const updated: Notification = {
        ...current,
        readAt: new Date(),
        updatedAt: new Date(),
      };
      notifications[idx] = updated;
      return updated;
    },

    async markAllRead(userId) {
      let count = 0;

      for (let i = 0; i < notifications.length; i++) {
        const current = notifications[i]!;

        if (current.userId === userId && current.readAt === null) {
          notifications[i] = { ...current, readAt: new Date(), updatedAt: new Date() };
          count += 1;
        }
      }

      return count;
    },

    async recordSend(id, data: RecordSendData) {
      const idx = notifications.findIndex((n) => n.id === id && n.status === "pending");

      if (idx === -1) {
        return null;
      }

      const current = notifications[idx]!;
      const sent = data.status === "sent";
      const updated: Notification = {
        ...current,
        status: data.status,
        providerReference: data.providerReference,
        failureReason: data.failureReason,
        sentAt: sent ? new Date() : null,
        failedAt: sent ? null : new Date(),
        updatedAt: new Date(),
      };
      notifications[idx] = updated;
      return updated;
    },
  };

  return {
    repo,
    seedNotification(notification) {
      notifications.push(notification);
    },
    getNotifications: () => notifications,
  };
}

export interface FakeNotificationProviderHandle {
  provider: NotificationProvider;
  setResult(result: SendNotificationResult): void;
  getSentInputs(): SendNotificationInput[];
}

export function createFakeNotificationProvider(): FakeNotificationProviderHandle {
  let result: SendNotificationResult = { success: true, providerReference: "fake-ref" };
  const sentInputs: SendNotificationInput[] = [];

  return {
    provider: {
      async send(input: SendNotificationInput): Promise<SendNotificationResult> {
        sentInputs.push(input);
        return result;
      },
    },
    setResult(next: SendNotificationResult) {
      result = next;
    },
    getSentInputs: () => sentInputs,
  };
}