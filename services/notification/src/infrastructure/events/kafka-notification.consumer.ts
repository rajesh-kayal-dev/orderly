import { EVENT_TYPES, type EventType } from "@orderly/contracts";
import type { HandlerMap, OrderlyConsumer } from "@orderly/events";
import type { NotificationEventHandler } from "../../application/events/notification-event.handler.ts";

export class KafkaNotificationConsumer {
  constructor(
    private readonly consumer: OrderlyConsumer,
    private readonly handler: NotificationEventHandler,
    private readonly groupId: string,
  ) {}

  async start(): Promise<void> {
    const handlers: HandlerMap = {};

    for (const type of EVENT_TYPES) {
      handlers[type as EventType] = async (envelope) => {
        try {
          await this.handler.handleEvent(envelope);
        } catch (error) {
          console.error(
            `[kafka-notification-consumer] Error handling event ${envelope.type} (${envelope.id}):`,
            error,
          );
        }
      };
    }

    await this.consumer.connect({
      groupId: this.groupId,
      handlers,
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
