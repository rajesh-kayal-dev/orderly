import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateDeliveryData,
  DeliveryRepository,
} from "../../../domain/delivery/delivery.repository.js";
import type { Delivery, DeliveryStatus } from "../../../domain/delivery/delivery.types.js";

const safeDeliverySelect = {
  id: true,
  orderId: true,
  partnerId: true,
  status: true,
  pickupTime: true,
  deliveredAt: true,
  distanceKm: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DeliverySelect;

type DeliveryRow = {
  id: string;
  orderId: string;
  partnerId: string | null;
  status: DeliveryStatus;
  pickupTime: Date | null;
  deliveredAt: Date | null;
  distanceKm: Prisma.Decimal | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDelivery(delivery: DeliveryRow): Delivery {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    partnerId: delivery.partnerId,
    status: delivery.status,
    pickupTime: delivery.pickupTime,
    deliveredAt: delivery.deliveredAt,
    distanceKm: delivery.distanceKm,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

export class PrismaDeliveryRepository implements DeliveryRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateDeliveryData): Promise<Delivery | null> {
    try {
      const delivery = await this.db.delivery.create({
        data: { orderId: data.orderId },
        select: safeDeliverySelect,
      });

      return toDelivery(delivery);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return null;
      }

      throw error;
    }
  }

  async findById(id: string): Promise<Delivery | null> {
    const delivery = await this.db.delivery.findUnique({
      where: { id },
      select: safeDeliverySelect,
    });

    return delivery ? toDelivery(delivery) : null;
  }

  async findByOrderId(orderId: string): Promise<Delivery | null> {
    const delivery = await this.db.delivery.findUnique({
      where: { orderId },
      select: safeDeliverySelect,
    });

    return delivery ? toDelivery(delivery) : null;
  }

  async findByPartnerId(partnerId: string): Promise<Delivery[]> {
    const deliveries = await this.db.delivery.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      select: safeDeliverySelect,
    });

    return deliveries.map(toDelivery);
  }

  async accept(id: string, partnerId: string): Promise<Delivery | null> {
    const result = await this.db.delivery.updateMany({
      where: { id, status: "pending", partnerId: null },
      data: { status: "assigned", partnerId },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findById(id);
  }
}