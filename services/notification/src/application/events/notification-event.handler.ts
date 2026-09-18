import {
  EventTypes,
  type DeliveryAssignedPayload,
  type DeliveryPickedUpPayload,
  type EventEnvelope,
  type OrderAssignedPayload,
  type OrderPlacedPayload,
  type PaymentCreatedPayload,
} from "@orderly/contracts";
import type { NotificationProvider } from "../../domain/notification/notification.provider.js";
import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { Notification } from "../../domain/notification/notification.types.js";
import { sendNotification } from "../notification/send-notification.js";

export interface NotificationCommand {
  userId: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
}

export class NotificationEventHandler {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly provider?: NotificationProvider | null,
  ) {}

  async handleEvent(envelope: EventEnvelope): Promise<Notification | null> {
    // 1. Idempotency Check: prevent duplicate processing for duplicate Kafka events
    if (this.notifications.findByMetadataEventId) {
      const existing = await this.notifications.findByMetadataEventId(envelope.id);
      if (existing) {
        return existing;
      }
    }

    // 2. Extract notification command if event has an explicit recipient mapping
    const command = this.mapEventToNotification(envelope);
    if (!command) {
      // Event has no explicit recipient user ID in payload (e.g. OrderAccepted, PaymentSucceeded)
      return null;
    }

    // 3. Persist notification record to DB
    const created = await this.notifications.create({
      userId: command.userId,
      channel: "in_app",
      recipient: null,
      title: command.title,
      body: command.body,
      metadata: {
        eventId: envelope.id,
        eventType: envelope.type,
        ...command.metadata,
      },
    });

    // 4. Send via provider if configured
    if (this.provider) {
      try {
        return await sendNotification(this.notifications, this.provider)(created.id);
      } catch (error) {
        // Provider failure records failure in DB record and does not crash handler
        console.error(`[notification-event] provider delivery error: ${String(error)}`);
      }
    }

    return created;
  }

  private mapEventToNotification(envelope: EventEnvelope): NotificationCommand | null {
    switch (envelope.type) {
      case EventTypes.OrderPlaced: {
        const payload = envelope.payload as OrderPlacedPayload;
        if (!payload.customerId) return null;
        return {
          userId: payload.customerId,
          title: "Order Placed",
          body: `Order #${payload.orderId} placed for ${payload.currency} ${payload.totalAmount}.`,
          metadata: { orderId: payload.orderId },
        };
      }

      case EventTypes.PaymentCreated: {
        const payload = envelope.payload as PaymentCreatedPayload;
        if (!payload.customerId) return null;
        return {
          userId: payload.customerId,
          title: "Payment Pending",
          body: `Payment of ${payload.currency} ${payload.amount} created for order #${payload.orderId}.`,
          metadata: { paymentId: payload.paymentId, orderId: payload.orderId },
        };
      }

      case EventTypes.OrderAssigned: {
        const payload = envelope.payload as OrderAssignedPayload;
        if (!payload.partnerId) return null;
        return {
          userId: payload.partnerId,
          title: "Delivery Assigned",
          body: `Delivery #${payload.deliveryId} for order #${payload.orderId} has been assigned to you.`,
          metadata: { deliveryId: payload.deliveryId, orderId: payload.orderId },
        };
      }

      case EventTypes.DeliveryAssigned: {
        const payload = envelope.payload as DeliveryAssignedPayload;
        if (!payload.partnerId) return null;
        return {
          userId: payload.partnerId,
          title: "Delivery Assigned",
          body: `Delivery #${payload.deliveryId} for order #${payload.orderId} has been assigned to you.`,
          metadata: { deliveryId: payload.deliveryId, orderId: payload.orderId },
        };
      }

      case EventTypes.DeliveryPickedUp: {
        const payload = envelope.payload as DeliveryPickedUpPayload;
        if (!payload.partnerId) return null;
        return {
          userId: payload.partnerId,
          title: "Order Picked Up",
          body: `Order #${payload.orderId} picked up for delivery.`,
          metadata: { deliveryId: payload.deliveryId, orderId: payload.orderId },
        };
      }

      default:
        // Other events (e.g. OrderAccepted, PaymentSucceeded, DeliveryInTransit, etc.) currently lack recipient user IDs in payload contracts
        return null;
    }
  }
}
