import type { Decimal } from "decimal.js";

export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "delivered" | "failed";

export const ASSIGNABLE_DELIVERY_STATUS: readonly DeliveryStatus[] = ["pending"];

export function isAssignableDeliveryStatus(status: DeliveryStatus): boolean {
  return ASSIGNABLE_DELIVERY_STATUS.includes(status);
}

export interface Delivery {
  id: string;
  orderId: string;
  partnerId: string | null;
  status: DeliveryStatus;
  pickupTime: Date | null;
  deliveredAt: Date | null;
  distanceKm: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}