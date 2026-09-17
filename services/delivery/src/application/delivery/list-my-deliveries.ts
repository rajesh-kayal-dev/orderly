import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import { DeliveryPartnerProfileNotFoundError } from "../delivery-partner/errors.js";

export const listMyDeliveries =
  (deliveries: DeliveryRepository, partners: DeliveryPartnerRepository) =>
  async (userId: string) => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    return deliveries.findByPartnerId(profile.id);
  };