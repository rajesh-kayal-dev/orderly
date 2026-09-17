import type { CreateNotificationData, NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification } from "../../domain/notification/notification.types.js";

export const createNotification =
  (notifications: NotificationRepository) =>
  async (data: CreateNotificationData): Promise<Notification> =>
    notifications.create(data);