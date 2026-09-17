import type { Decimal } from "decimal.js";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  pending: ["assigned"],
  assigned: ["picked_up", "failed"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["delivered", "failed"],
  delivered: [],
  failed: [],
};

export function canTransitionDeliveryStatus(current: DeliveryStatus, next: DeliveryStatus): boolean {
  return DELIVERY_TRANSITIONS[current]?.includes(next) ?? false;
}

export function sourcesOfDeliveryTransition(target: DeliveryStatus): readonly DeliveryStatus[] {
  return (Object.keys(DELIVERY_TRANSITIONS) as DeliveryStatus[]).filter((current) =>
    canTransitionDeliveryStatus(current, target),
  );
}

export interface Delivery {
  id: string;
  orderId: string;
  partnerId: string | null;
  status: DeliveryStatus;
  pickupTime: Date | null;
  inTransitAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  distanceKm: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}