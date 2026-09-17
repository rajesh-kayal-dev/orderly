import { Decimal } from "decimal.js";
import type {
  CreateDeliveryPartnerData,
  DeliveryPartnerRepository,
  UpdateDeliveryPartnerData,
} from "../../src/domain/delivery-partner/delivery-partner.repository.js";
import {
  DEFAULT_VEHICLE_TYPE,
  type DeliveryPartner,
} from "../../src/domain/delivery-partner/delivery-partner.types.js";

let partnerSeq = 0;

export function makeDeliveryPartner(
  userId: string,
  overrides: Partial<DeliveryPartner> = {},
): DeliveryPartner {
  const now = new Date();
  return {
    id: overrides.id ?? `partner-${++partnerSeq}`,
    userId,
    vehicleType: overrides.vehicleType ?? DEFAULT_VEHICLE_TYPE,
    vehicleNumber: overrides.vehicleNumber ?? null,
    isAvailable: overrides.isAvailable ?? false,
    latitude: overrides.latitude ?? null,
    longitude: overrides.longitude ?? null,
    lastLocationUpdate: overrides.lastLocationUpdate ?? null,
    rating: overrides.rating ?? new Decimal("5.00"),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export interface FakeDeliveryPartnerRepositoryHandle {
  repo: DeliveryPartnerRepository;
  seedProfile(profile: DeliveryPartner): void;
  getProfiles(): DeliveryPartner[];
}

export function createFakeDeliveryPartnerRepository(): FakeDeliveryPartnerRepositoryHandle {
  const profiles: DeliveryPartner[] = [];

  const repo: DeliveryPartnerRepository = {
    async create(data: CreateDeliveryPartnerData) {
      const existing = profiles.find((p) => p.userId === data.userId);

      if (existing) {
        return existing;
      }

      const profile = makeDeliveryPartner(data.userId, {
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
      });
      profiles.push(profile);
      return profile;
    },

    async findProfileByUserId(userId) {
      return profiles.find((p) => p.userId === userId) ?? null;
    },

    async update(id: string, data: UpdateDeliveryPartnerData) {
      const idx = profiles.findIndex((p) => p.id === id);

      if (idx === -1) {
        return null;
      }

      const current = profiles[idx]!;
      const updated: DeliveryPartner = {
        ...current,
        vehicleType: data.vehicleType !== undefined ? data.vehicleType : current.vehicleType,
        vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : current.vehicleNumber,
        updatedAt: new Date(),
      };
      profiles[idx] = updated;
      return updated;
    },

    async setAvailability(id: string, isAvailable: boolean) {
      const idx = profiles.findIndex((p) => p.id === id);

      if (idx === -1) {
        return null;
      }

      const updated: DeliveryPartner = {
        ...profiles[idx]!,
        isAvailable,
        updatedAt: new Date(),
      };
      profiles[idx] = updated;
      return updated;
    },
  };

  return {
    repo,
    seedProfile(profile) {
      profiles.push(profile);
    },
    getProfiles: () => profiles,
  };
}