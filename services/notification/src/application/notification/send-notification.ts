import type { NotificationProvider } from "../../domain/notification/notification.provider.js";
import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification } from "../../domain/notification/notification.types.js";
import { NotificationAlreadySentError, NotificationNotFoundError } from "./errors.js";

export const sendNotification =
  (notifications: NotificationRepository, provider: NotificationProvider) =>
  async (id: string): Promise<Notification> => {
    const notification = await notifications.findById(id);

    if (!notification) {
      throw new NotificationNotFoundError();
    }

    if (notification.status !== "pending") {
      throw new NotificationAlreadySentError();
    }

    const result = await provider.send({
      userId: notification.userId,
      channel: notification.channel,
      recipient: notification.recipient,
      title: notification.title,
      body: notification.body,
      metadata: notification.metadata,
    });

    const recorded = !result.success
      ? await notifications.recordSend(id, {
          status: "failed",
          providerReference: result.providerReference ?? null,
          failureReason: result.failureReason ?? "Notification provider rejected delivery",
        })
      : await notifications.recordSend(id, {
          status: "sent",
          providerReference: result.providerReference ?? null,
          failureReason: null,
        });

    if (!recorded) {
      throw new NotificationAlreadySentError();
    }

    return recorded;
  };