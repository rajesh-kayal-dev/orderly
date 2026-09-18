import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import type { DeliveryEventPublisher } from "./delivery-event.publisher.js";
import { DeliveryPartnerProfileNotFoundError } from "../delivery-partner/errors.js";
import {
  DeliveryNotFoundError,
  DeliveryNotAvailableError,
  DeliveryPartnerUnavailableError,
} from "./errors.js";

export const acceptDelivery =
  (
    deliveries: DeliveryRepository,
    partners: DeliveryPartnerRepository,
    eventPublisher?: DeliveryEventPublisher | null,
  ) =>
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

    if (!profile.isAvailable) {
      throw new DeliveryPartnerUnavailableError();
    }

    const accepted = await deliveries.accept(id, profile.id);

    if (!accepted) {
      throw new DeliveryNotAvailableError();
    }

    if (eventPublisher) {
      await eventPublisher.publishDeliveryAssigned(accepted);
    }

    return accepted;
  };