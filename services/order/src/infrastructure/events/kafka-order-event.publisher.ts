import { EventTypes } from "@orderly/contracts";
import type { OrderlyProducer } from "@orderly/events";
import type { OrderEventPublisher } from "../../application/order/order-event.publisher.js";
import type { Order, OrderStatus } from "../../domain/order/order.types.js";

export class KafkaOrderEventPublisher implements OrderEventPublisher {
  constructor(private readonly producer: OrderlyProducer) {}

  async publishOrderPlaced(order: Order): Promise<void> {
    const payload: any = {
      orderId: order.id,
      restaurantId: order.restaurantId,
      subtotal: order.subtotal.toFixed(2),
      deliveryFee: order.deliveryFee.toFixed(2),
      totalAmount: order.totalAmount.toFixed(2),
      currency: "INR",
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    };

    if (order.customerId) {
      payload.customerId = order.customerId;
    }
    if (order.guestSessionId) {
      payload.guestSessionId = order.guestSessionId;
    }
    if (order.contactInfo) {
      payload.contactInfo = order.contactInfo;
    }

    await this.producer.publish(
      EventTypes.OrderPlaced,
      payload,
      { key: order.id },
    );
  }

  async publishOrderStatusChanged(order: Order, previousStatus: OrderStatus): Promise<void> {
    if (previousStatus === order.status) {
      return;
    }

    switch (order.status) {
      case "accepted":
        await this.producer.publish(
          EventTypes.OrderAccepted,
          { orderId: order.id, restaurantId: order.restaurantId, acceptedAt: order.updatedAt.toISOString() },
          { key: order.id },
        );
        return;
      case "preparing":
        await this.producer.publish(EventTypes.OrderPreparing, { orderId: order.id }, { key: order.id });
        return;
      case "ready":
        await this.producer.publish(EventTypes.OrderReady, { orderId: order.id }, { key: order.id });
        return;
      case "cancelled":
        await this.producer.publish(
          EventTypes.OrderCancelled,
          { orderId: order.id, cancelledAt: order.updatedAt.toISOString() },
          { key: order.id },
        );
        return;
      default:
        throw new Error(`No Order lifecycle event is defined for status transition to ${order.status}`);
    }
  }
}
