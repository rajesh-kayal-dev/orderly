import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateDeliveryPartnerData,
  DeliveryPartnerRepository,
  UpdateDeliveryPartnerData,
} from "../../../domain/delivery-partner/delivery-partner.repository.js";
import { DEFAULT_VEHICLE_TYPE } from "../../../domain/delivery-partner/delivery-partner.types.js";
import type { DeliveryPartner } from "../../../domain/delivery-partner/delivery-partner.types.js";

const safeDeliveryPartnerSelect = {
  id: true,
  userId: true,
  vehicleType: true,
  vehicleNumber: true,
  isAvailable: true,
  latitude: true,
  longitude: true,
  lastLocationUpdate: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeliveryPartnerSelect;

type DeliveryPartnerRow = {
  id: string;
  userId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: Date | null;
  rating: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
};

function toDeliveryPartner(partner: DeliveryPartnerRow): DeliveryPartner {
  return {
    id: partner.id,
    userId: partner.userId,
    vehicleType: partner.vehicleType,
    vehicleNumber: partner.vehicleNumber,
    isAvailable: partner.isAvailable,
    latitude: partner.latitude,
    longitude: partner.longitude,
    lastLocationUpdate: partner.lastLocationUpdate,
    rating: partner.rating,
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
  };
}

export class PrismaDeliveryPartnerRepository implements DeliveryPartnerRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateDeliveryPartnerData): Promise<DeliveryPartner> {
    return this.db.deliveryPartner
      .create({
        data: {
          userId: data.userId,
          vehicleType: data.vehicleType ?? DEFAULT_VEHICLE_TYPE,
          vehicleNumber: data.vehicleNumber,
        },
        select: safeDeliveryPartnerSelect,
      })
      .then(toDeliveryPartner);
  }

  async findProfileByUserId(userId: string): Promise<DeliveryPartner | null> {
    const partner = await this.db.deliveryPartner.findUnique({
      where: { userId },
      select: safeDeliveryPartnerSelect,
    });

    return partner ? toDeliveryPartner(partner) : null;
  }

  async update(id: string, data: UpdateDeliveryPartnerData): Promise<DeliveryPartner | null> {
    const existing = await this.db.deliveryPartner.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const partner = await this.db.deliveryPartner.update({
      where: { id },
      data,
      select: safeDeliveryPartnerSelect,
    });

    return toDeliveryPartner(partner);
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<DeliveryPartner | null> {
    const existing = await this.db.deliveryPartner.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const partner = await this.db.deliveryPartner.update({
      where: { id },
      data: { isAvailable },
      select: safeDeliveryPartnerSelect,
    });

    return toDeliveryPartner(partner);
  }
}