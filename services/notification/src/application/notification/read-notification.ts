import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification } from "../../domain/notification/notification.types.js";
import { NotificationNotFoundError, NotificationNotOwnedError } from "./errors.js";

export const readNotification =
  (notifications: NotificationRepository) =>
  async (userId: string, id: string): Promise<Notification> => {
    const updated = await notifications.markRead(id, userId);

    if (updated) {
      return updated;
    }

    const existing = await notifications.findById(id);

    if (!existing) {
      throw new NotificationNotFoundError();
    }

    throw new NotificationNotOwnedError();
  };