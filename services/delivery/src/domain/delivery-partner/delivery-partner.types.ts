import type { Decimal } from "decimal.js";

export const DEFAULT_VEHICLE_TYPE = "Scooter / Bike";

export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: Date | null;
  rating: Decimal;
  createdAt: Date;
  updatedAt: Date;
}