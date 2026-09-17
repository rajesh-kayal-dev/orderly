import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import { DeliveryPartnerProfileNotFoundError } from "../delivery-partner/errors.js";
import { DeliveryNotFoundError, DeliveryNotAvailableError } from "./errors.js";

export const acceptDelivery =
  (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  async (userId: string, id: string) => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    const delivery = await deliveries.findById(id);

    if (!delivery) {
      throw new DeliveryNotFoundError();
    }

    if (delivery.status === "assigned" && delivery.partnerId === profile.id) {
      return delivery;
    }

    if (delivery.status !== "pending" || delivery.partnerId !== null) {
      throw new DeliveryNotAvailableError();
    }

    const accepted = await deliveries.accept(id, profile.id);

    if (!accepted) {
      throw new DeliveryNotAvailableError();
    }

    return accepted;
  };