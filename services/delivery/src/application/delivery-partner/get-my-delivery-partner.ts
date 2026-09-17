import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryPartner } from "../../domain/delivery-partner/delivery-partner.types.js";

export interface GetMyDeliveryPartnerResult {
  profile: DeliveryPartner;
  created: boolean;
}

export const getMyDeliveryPartner =
  (partners: DeliveryPartnerRepository) =>
  async (userId: string): Promise<GetMyDeliveryPartnerResult> => {
    const existing = await partners.findProfileByUserId(userId);

    if (existing) {
      return { profile: existing, created: false };
    }

    const profile = await partners.create({ userId });

    return { profile, created: true };
  };