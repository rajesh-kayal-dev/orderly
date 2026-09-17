import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import type { Delivery } from "../../domain/delivery/delivery.types.js";
import { DeliveryPartnerProfileNotFoundError } from "../delivery-partner/errors.js";
import { DeliveryNotAssignedToPartnerError, DeliveryNotFoundError } from "./errors.js";

export const getMyAccessibleDelivery =
  (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  async (userId: string, id: string): Promise<Delivery> => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    const delivery = await deliveries.findById(id);

    if (!delivery) {
      throw new DeliveryNotFoundError();
    }

    const ownsDelivery = delivery.partnerId === profile.id;
    const isAvailablePoolDelivery = delivery.status === "pending" && delivery.partnerId === null;

    if (!ownsDelivery && !isAvailablePoolDelivery) {
      throw new DeliveryNotAssignedToPartnerError();
    }

    return delivery;
  };