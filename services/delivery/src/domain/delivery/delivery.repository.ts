import type { Delivery, DeliveryStatus } from "./delivery.types.js";

export interface CreateDeliveryData {
  orderId: string;
}

export interface DeliveryTransitionTarget {
  fromStatuses: readonly DeliveryStatus[];
  target: DeliveryStatus;
}

export interface DeliveryRepository {
  create(data: CreateDeliveryData): Promise<Delivery | null>;
  findById(id: string): Promise<Delivery | null>;
  findByOrderId(orderId: string): Promise<Delivery | null>;
  findByPartnerId(partnerId: string): Promise<Delivery[]>;
  accept(id: string, partnerId: string): Promise<Delivery | null>;
  transition(id: string, partnerId: string, target: DeliveryTransitionTarget): Promise<Delivery | null>;
}