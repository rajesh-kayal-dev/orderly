import { EventTypes } from "@orderly/contracts";
import type { OrderlyProducer } from "@orderly/events";
import type { DeliveryEventPublisher } from "../../application/delivery/delivery-event.publisher.js";
import type { Delivery } from "../../domain/delivery/delivery.types.js";

export class KafkaDeliveryEventPublisher implements DeliveryEventPublisher {
  constructor(private readonly producer: OrderlyProducer) {}

  async publishDeliveryCreated(delivery: Delivery): Promise<void> {
    await this.producer.publish(
      EventTypes.DeliveryCreated,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        createdAt: delivery.createdAt.toISOString(),
      },
      { key: delivery.orderId },
    );
  }

  async publishDeliveryAssigned(delivery: Delivery): Promise<void> {
    if (!delivery.partnerId) {
      throw new Error("Cannot publish delivery.assigned without a partnerId");
    }
    await this.producer.publish(
      EventTypes.DeliveryAssigned,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        partnerId: delivery.partnerId,
        assignedAt: delivery.updatedAt.toISOString(),
      },
      { key: delivery.orderId },
    );
  }

  async publishDeliveryPickedUp(delivery: Delivery): Promise<void> {
    if (!delivery.partnerId) {
      throw new Error("Cannot publish delivery.picked_up without a partnerId");
    }
    await this.producer.publish(
      EventTypes.DeliveryPickedUp,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        partnerId: delivery.partnerId,
      },
      { key: delivery.orderId },
    );
  }

  async publishDeliveryInTransit(delivery: Delivery): Promise<void> {
    await this.producer.publish(
      EventTypes.DeliveryInTransit,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
      },
      { key: delivery.orderId },
    );
  }

  async publishDeliveryDelivered(delivery: Delivery): Promise<void> {
    await this.producer.publish(
      EventTypes.DeliveryDelivered,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        deliveredAt: (delivery.deliveredAt ?? delivery.updatedAt).toISOString(),
      },
      { key: delivery.orderId },
    );
  }

  async publishDeliveryFailed(delivery: Delivery, failureReason: string | null = null): Promise<void> {
    await this.producer.publish(
      EventTypes.DeliveryFailed,
      {
        deliveryId: delivery.id,
        orderId: delivery.orderId,
        failureReason,
      },
      { key: delivery.orderId },
    );
  }
}
