import { randomUUID } from "node:crypto";
import type {
  NotificationProvider,
  SendNotificationInput,
  SendNotificationResult,
} from "../../domain/notification/notification.provider.js";

export class ConsoleNotificationProvider implements NotificationProvider {
  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    console.log(
      `[notification] channel=${input.channel} userId=${input.userId} recipient=${input.recipient ?? ""} title=${input.title}`,
    );

    return { success: true, providerReference: `console-${randomUUID()}` };
  }
}