import type { Prisma, PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateMenuCategoryData,
  CreateMenuItemData,
  MenuRepository,
  UpdateMenuCategoryData,
  UpdateMenuItemData,
} from "../../../domain/menu/menu.repository.js";
import type {
  MenuCategory,
  MenuCategoryWithItems,
  MenuItem,
} from "../../../domain/menu/menu.types.js";

const safeCategorySelect = {
  id: true,
  restaurantId: true,
  name: true,
  sortOrder: true,
  createdAt: true,
} satisfies Prisma.MenuCategorySelect;

const safeMenuItemSelect = {
  id: true,
  restaurantId: true,
  categoryId: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MenuItemSelect;

export class PrismaMenuRepository implements MenuRepository {
  constructor(private readonly db: PrismaClient) {}

  async createCategory(data: CreateMenuCategoryData): Promise<MenuCategory> {
    return this.db.menuCategory.create({
      data,
      select: safeCategorySelect,
    });
  }

  async findCategoryById(id: string): Promise<MenuCategory | null> {
    return this.db.menuCategory.findUnique({
      where: { id },
      select: safeCategorySelect,
    });
  }

  async listCategoriesByRestaurant(restaurantId: string): Promise<MenuCategory[]> {
    return this.db.menuCategory.findMany({
      where: { restaurantId },
      select: safeCategorySelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async listCategoriesWithItems(restaurantId: string): Promise<MenuCategoryWithItems[]> {
    const categories = await this.db.menuCategory.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        menuItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      restaurantId: category.restaurantId,
      name: category.name,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      items: category.menuItems,
    }));
  }

  async updateCategory(id: string, data: UpdateMenuCategoryData): Promise<MenuCategory | null> {
    const existing = await this.db.menuCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.menuCategory.update({
      where: { id },
      data,
      select: safeCategorySelect,
    });
  }

  async createMenuItem(data: CreateMenuItemData): Promise<MenuItem> {
    return this.db.menuItem.create({
      data,
      select: safeMenuItemSelect,
    });
  }

  async findMenuItemById(id: string): Promise<MenuItem | null> {
    return this.db.menuItem.findUnique({
      where: { id },
      select: safeMenuItemSelect,
    });
  }

  async listMenuItemsByRestaurant(restaurantId: string, categoryId?: string): Promise<MenuItem[]> {
    const where: Prisma.MenuItemWhereInput = { restaurantId };

    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    return this.db.menuItem.findMany({
      where,
      select: safeMenuItemSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<MenuItem | null> {
    const existing = await this.db.menuItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.menuItem.update({
      where: { id },
      data,
      select: safeMenuItemSelect,
    });
  }

  async updateMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem | null> {
    const existing = await this.db.menuItem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.menuItem.update({
      where: { id },
      data: { isAvailable },
      select: safeMenuItemSelect,
    });
  }
}