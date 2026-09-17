import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification, NotificationStatus } from "../../domain/notification/notification.types.js";

export const listMyNotifications =
  (notifications: NotificationRepository) =>
  async (userId: string, status?: NotificationStatus): Promise<Notification[]> =>
    notifications.listByUserId(userId, { status });