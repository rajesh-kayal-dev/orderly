import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification } from "../../domain/notification/notification.types.js";
import { NotificationNotFoundError, NotificationNotOwnedError } from "./errors.js";

export const getNotification =
  (notifications: NotificationRepository) =>
  async (id: string): Promise<Notification> => {
    const notification = await notifications.findById(id);

    if (!notification) {
      throw new NotificationNotFoundError();
    }

    return notification;
  };

export const getMyNotification =
  (notifications: NotificationRepository) =>
  async (userId: string, id: string): Promise<Notification> => {
    const notification = await getNotification(notifications)(id);

    if (notification.userId !== userId) {
      throw new NotificationNotOwnedError();
    }

    return notification;
  };