import { Decimal } from "decimal.js";
import type {
  CreateDeliveryData,
  DeliveryRepository,
} from "../../src/domain/delivery/delivery.repository.js";
import type { Delivery, DeliveryStatus } from "../../src/domain/delivery/delivery.types.js";

let deliverySeq = 0;

export function makeDelivery(
  orderId: string,
  overrides: Partial<Delivery> = {},
): Delivery {
  const now = new Date();
  return {
    id: overrides.id ?? `delivery-${++deliverySeq}`,
    orderId,
    partnerId: overrides.partnerId ?? null,
    status: overrides.status ?? "pending",
    pickupTime: overrides.pickupTime ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    distanceKm: overrides.distanceKm ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export interface FakeDeliveryRepositoryHandle {
  repo: DeliveryRepository;
  seedDelivery(delivery: Delivery): void;
  getDeliveries(): Delivery[];
}

export function createFakeDeliveryRepository(): FakeDeliveryRepositoryHandle {
  const deliveries: Delivery[] = [];

  const repo: DeliveryRepository = {
    async create(data: CreateDeliveryData) {
      if (deliveries.some((d) => d.orderId === data.orderId)) {
        return null;
      }

      const delivery = makeDelivery(data.orderId);
      deliveries.push(delivery);
      return delivery;
    },

    async findById(id) {
      return deliveries.find((d) => d.id === id) ?? null;
    },

    async findByOrderId(orderId) {
      return deliveries.find((d) => d.orderId === orderId) ?? null;
    },

    async findByPartnerId(partnerId) {
      return deliveries
        .filter((d) => d.partnerId === partnerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async accept(id: string, partnerId: string) {
      const idx = deliveries.findIndex(
        (d) => d.id === id && d.status === "pending" && d.partnerId === null,
      );

      if (idx === -1) {
        return null;
      }

      const current = deliveries[idx]!;
      const updated: Delivery = {
        ...current,
        status: "assigned" as DeliveryStatus,
        partnerId,
        updatedAt: new Date(),
      };
      deliveries[idx] = updated;
      return updated;
    },
  };

  return {
    repo,
    seedDelivery(delivery) {
      deliveries.push(delivery);
    },
    getDeliveries: () => deliveries,
  };
}