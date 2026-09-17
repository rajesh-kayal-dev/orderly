import type { DeliveryPartner } from "./delivery-partner.types.js";

export interface CreateDeliveryPartnerData {
  userId: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface UpdateDeliveryPartnerData {
  vehicleType?: string | null;
  vehicleNumber?: string | null;
}

export interface DeliveryPartnerRepository {
  create(data: CreateDeliveryPartnerData): Promise<DeliveryPartner>;
  findProfileByUserId(userId: string): Promise<DeliveryPartner | null>;
  update(id: string, data: UpdateDeliveryPartnerData): Promise<DeliveryPartner | null>;
  setAvailability(id: string, isAvailable: boolean): Promise<DeliveryPartner | null>;
}