import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import { DeliveryNotFoundError } from "./errors.js";

export const getDelivery =
  (deliveries: DeliveryRepository) =>
  async (id: string) => {
    const delivery = await deliveries.findById(id);

    if (!delivery) {
      throw new DeliveryNotFoundError();
    }

    return delivery;
  };