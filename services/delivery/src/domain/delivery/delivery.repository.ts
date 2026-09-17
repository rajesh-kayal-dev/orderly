import type { Delivery } from "./delivery.types.js";

export interface CreateDeliveryData {
  orderId: string;
}

export interface DeliveryRepository {
  create(data: CreateDeliveryData): Promise<Delivery | null>;
  findById(id: string): Promise<Delivery | null>;
  findByOrderId(orderId: string): Promise<Delivery | null>;
  findByPartnerId(partnerId: string): Promise<Delivery[]>;
  accept(id: string, partnerId: string): Promise<Delivery | null>;
}