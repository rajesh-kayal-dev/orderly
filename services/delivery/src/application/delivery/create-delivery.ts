import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import type { DeliveryEventPublisher } from "./delivery-event.publisher.js";
import { DeliveryForOrderAlreadyExistsError } from "./errors.js";

export const createDelivery =
  (deliveries: DeliveryRepository, eventPublisher?: DeliveryEventPublisher | null) =>
  async (orderId: string) => {
    const existing = await deliveries.findByOrderId(orderId);

    if (existing) {
      throw new DeliveryForOrderAlreadyExistsError();
    }

    const delivery = await deliveries.create({ orderId });

    if (!delivery) {
      throw new DeliveryForOrderAlreadyExistsError();
    }

    if (eventPublisher) {
      await eventPublisher.publishDeliveryCreated(delivery);
    }

    return delivery;
  };