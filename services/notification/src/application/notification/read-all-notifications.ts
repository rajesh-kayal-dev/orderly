import type { NotificationRepository } from "../../domain/notification/notification.repository.js";

export const readAllNotifications =
  (notifications: NotificationRepository) =>
  async (userId: string): Promise<{ updatedCount: number }> => {
    const updatedCount = await notifications.markAllRead(userId);
    return { updatedCount };
  };