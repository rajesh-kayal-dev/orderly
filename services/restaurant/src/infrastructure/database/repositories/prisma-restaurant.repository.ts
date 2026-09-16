import type { Prisma, PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateRestaurantData,
  ListRestaurantsParams,
  ListRestaurantsResult,
  RestaurantRepository,
  UpdateRestaurantData,
} from "../../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../../domain/restaurant/restaurant.types.js";

const safeRestaurantSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  address: true,
  imageUrl: true,
  isActive: true,
  isOpen: true,
  opensAt: true,
  closesAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RestaurantSelect;

export class PrismaRestaurantRepository implements RestaurantRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateRestaurantData): Promise<Restaurant> {
    return this.db.restaurant.create({
      data,
      select: safeRestaurantSelect,
    });
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.db.restaurant.findUnique({
      where: { id },
      select: safeRestaurantSelect,
    });
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    return this.db.restaurant.findUnique({
      where: { ownerId },
      select: safeRestaurantSelect,
    });
  }

  async update(id: string, data: UpdateRestaurantData): Promise<Restaurant | null> {
    const existing = await this.db.restaurant.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.restaurant.update({
      where: { id },
      data,
      select: safeRestaurantSelect,
    });
  }

  async updateOpenState(id: string, isOpen: boolean): Promise<Restaurant | null> {
    const existing = await this.db.restaurant.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.restaurant.update({
      where: { id },
      data: { isOpen },
      select: safeRestaurantSelect,
    });
  }

  async list(params: ListRestaurantsParams): Promise<ListRestaurantsResult> {
    const where: Prisma.RestaurantWhereInput = {};

    if (params.activeOnly) {
      where.isActive = true;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { address: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, restaurants] = await Promise.all([
      this.db.restaurant.count({ where }),
      this.db.restaurant.findMany({
        where,
        select: safeRestaurantSelect,
        orderBy: { name: "asc" },
        skip: params.offset,
        take: params.limit,
      }),
    ]);

    return { restaurants, total };
  }
}