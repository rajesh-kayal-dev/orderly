import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryPartner } from "../../domain/delivery-partner/delivery-partner.types.js";

export interface CreateMyDeliveryPartnerInput {
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface CreateMyDeliveryPartnerResult {
  profile: DeliveryPartner;
  created: boolean;
}

export const createMyDeliveryPartner =
  (partners: DeliveryPartnerRepository) =>
  async (
    userId: string,
    input: CreateMyDeliveryPartnerInput,
  ): Promise<CreateMyDeliveryPartnerResult> => {
    const existing = await partners.findProfileByUserId(userId);

    if (existing) {
      return { profile: existing, created: false };
    }

    const profile = await partners.create({
      userId,
      vehicleType: input.vehicleType,
      vehicleNumber: input.vehicleNumber,
    });

    return { profile, created: true };
  };