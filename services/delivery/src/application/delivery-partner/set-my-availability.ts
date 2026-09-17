import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryPartner } from "../../domain/delivery-partner/delivery-partner.types.js";
import {
  DeliveryPartnerNotFoundError,
  DeliveryPartnerProfileNotFoundError,
} from "./errors.js";

export const setMyAvailability =
  (partners: DeliveryPartnerRepository) =>
  async (userId: string, isAvailable: boolean): Promise<DeliveryPartner> => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    const updated = await partners.setAvailability(profile.id, isAvailable);

    if (!updated) {
      throw new DeliveryPartnerNotFoundError();
    }

    return updated;
  };