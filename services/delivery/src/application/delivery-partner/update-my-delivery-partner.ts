import type {
  DeliveryPartnerRepository,
  UpdateDeliveryPartnerData,
} from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryPartner } from "../../domain/delivery-partner/delivery-partner.types.js";
import {
  DeliveryPartnerNotFoundError,
  DeliveryPartnerProfileNotFoundError,
} from "./errors.js";

export const updateMyDeliveryPartner =
  (partners: DeliveryPartnerRepository) =>
  async (userId: string, data: UpdateDeliveryPartnerData): Promise<DeliveryPartner> => {
    const profile = await partners.findProfileByUserId(userId);

    if (!profile) {
      throw new DeliveryPartnerProfileNotFoundError();
    }

    const updated = await partners.update(profile.id, data);

    if (!updated) {
      throw new DeliveryPartnerNotFoundError();
    }

    return updated;
  };