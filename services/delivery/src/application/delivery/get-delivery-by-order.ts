import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import { DeliveryForOrderNotFoundError } from "./errors.js";

export const getDeliveryByOrder =
  (deliveries: DeliveryRepository) =>
  async (orderId: string) => {
    const delivery = await deliveries.findByOrderId(orderId);

    if (!delivery) {
      throw new DeliveryForOrderNotFoundError();
    }

    return delivery;
  };