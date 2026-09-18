import type { Delivery } from "../../domain/delivery/delivery.types.js";

/**
 * Publishes Delivery lifecycle facts after the corresponding Delivery persistence / state
 * transition operation has succeeded. Implementations are infrastructure concerns.
 */
export interface DeliveryEventPublisher {
  publishDeliveryCreated(delivery: Delivery): Promise<void>;
  publishDeliveryAssigned(delivery: Delivery): Promise<void>;
  publishDeliveryPickedUp(delivery: Delivery): Promise<void>;
  publishDeliveryInTransit(delivery: Delivery): Promise<void>;
  publishDeliveryDelivered(delivery: Delivery): Promise<void>;
  publishDeliveryFailed(delivery: Delivery, failureReason?: string | null): Promise<void>;
}
