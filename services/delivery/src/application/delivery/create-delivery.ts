import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import { DeliveryForOrderAlreadyExistsError } from "./errors.js";

export const createDelivery =
  (deliveries: DeliveryRepository) =>
  async (orderId: string) => {
    const existing = await deliveries.findByOrderId(orderId);

    if (existing) {
      throw new DeliveryForOrderAlreadyExistsError();
    }

    const delivery = await deliveries.create({ orderId });

    if (!delivery) {
      throw new DeliveryForOrderAlreadyExistsError();
    }

    return delivery;
  };