import { Decimal } from "decimal.js";
import type {
  CreateMenuCategoryData,
  CreateMenuItemData,
  MenuRepository,
  UpdateMenuItemData,
} from "../../src/domain/menu/menu.repository.js";
import type {
  MenuCategory,
  MenuCategoryWithItems,
  MenuItem,
} from "../../src/domain/menu/menu.types.js";
import type {
  CreateRestaurantData,
  ListRestaurantsParams,
  ListRestaurantsResult,
  RestaurantRepository,
  UpdateRestaurantData,
} from "../../src/domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../src/domain/restaurant/restaurant.types.js";

let restaurantSeq = 0;
let categorySeq = 0;
let itemSeq = 0;

export function makeRestaurant(id: string, overrides: Partial<Restaurant> = {}): Restaurant {
  const now = new Date();
  return {
    id,
    ownerId: overrides.ownerId ?? `owner-${id}`,
    name: overrides.name ?? "Test Restaurant",
    description: overrides.description ?? null,
    address: overrides.address ?? null,
    imageUrl: overrides.imageUrl ?? null,
    isActive: overrides.isActive ?? true,
    isOpen: overrides.isOpen ?? true,
    opensAt: overrides.opensAt ?? null,
    closesAt: overrides.closesAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export function makeCategory(id: string, overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id,
    restaurantId: overrides.restaurantId ?? "r1",
    name: overrides.name ?? "Category",
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

export function makeMenuItem(id: string, overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id,
    restaurantId: overrides.restaurantId ?? "r1",
    categoryId: overrides.categoryId ?? null,
    name: overrides.name ?? "Menu Item",
    description: overrides.description ?? null,
    price: overrides.price ?? new Decimal("10.00"),
    imageUrl: overrides.imageUrl ?? null,
    isAvailable: overrides.isAvailable ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

export interface FakeRepositoryHandle {
  restaurantRepo: RestaurantRepository;
  menuRepo: MenuRepository;
  seedRestaurant(r: Restaurant): void;
  seedCategory(c: MenuCategory): void;
  seedMenuItem(i: MenuItem): void;
  getRestaurants(): Restaurant[];
  getCategories(): MenuCategory[];
  getMenuItems(): MenuItem[];
  nextRestaurantId(): string;
  nextCategoryId(): string;
  nextMenuItemId(): string;
  setOwnerRestaurantId(ownerId: string, restaurantId: string): void;
  getRestaurantByOwnerId(ownerId: string): Restaurant | undefined;
  getRestaurantById(id: string): Restaurant | undefined;
  getCategoriesByRestaurantId(restaurantId: string): MenuCategory[];
}

export function createFakeRepository(): FakeRepositoryHandle {
  const restaurants: Restaurant[] = [];
  const categories: MenuCategory[] = [];
  const items: MenuItem[] = [];

  const nextRestaurantId = (): string => `rest-${++restaurantSeq}`;
  const nextCategoryId = (): string => `cat-${++categorySeq}`;
  const nextMenuItemId = (): string => `item-${++itemSeq}`;

  const seedRestaurant = (r: Restaurant): void => {
    const idx = restaurants.findIndex((e) => e.id === r.id);
    if (idx === -1) restaurants.push(r);
    else restaurants[idx] = r;
  };

  const seedCategory = (c: MenuCategory): void => {
    const idx = categories.findIndex((e) => e.id === c.id);
    if (idx === -1) categories.push(c);
    else categories[idx] = c;
  };

  const seedMenuItem = (i: MenuItem): void => {
    const idx = items.findIndex((e) => e.id === i.id);
    if (idx === -1) items.push(i);
    else items[idx] = i;
  };

  const restaurantRepo: RestaurantRepository = {
    async create(data) {
      const now = new Date();
      const restaurant: Restaurant = {
        id: nextRestaurantId(),
        ownerId: data.ownerId,
        name: data.name,
        description: data.description ?? null,
        address: data.address ?? null,
        imageUrl: data.imageUrl ?? null,
        isActive: true,
        isOpen: true,
        opensAt: data.opensAt ?? null,
        closesAt: data.closesAt ?? null,
        createdAt: now,
        updatedAt: now,
      };
      seedRestaurant(restaurant);
      return restaurant;
    },

    async findById(id) {
      return restaurants.find((r) => r.id === id) ?? null;
    },

    async findByOwnerId(ownerId) {
      return restaurants.find((r) => r.ownerId === ownerId) ?? null;
    },

    async update(id, data) {
      const idx = restaurants.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const existing = restaurants[idx]!;
      const updated: Restaurant = {
        ...existing,
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        address: data.address !== undefined ? data.address : existing.address,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
        opensAt: data.opensAt !== undefined ? data.opensAt : existing.opensAt,
        closesAt: data.closesAt !== undefined ? data.closesAt : existing.closesAt,
        updatedAt: new Date(),
      };
      restaurants[idx] = updated;
      return updated;
    },

    async updateOpenState(id, isOpen) {
      const idx = restaurants.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const existing = restaurants[idx]!;
      const updated: Restaurant = { ...existing, isOpen, updatedAt: new Date() };
      restaurants[idx] = updated;
      return updated;
    },

    async list(params) {
      let list = [...restaurants];

      if (params.activeOnly) {
        list = list.filter((r) => r.isActive);
      }

      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.description?.toLowerCase().includes(q) ?? false) ||
            (r.address?.toLowerCase().includes(q) ?? false),
        );
      }

      list.sort((a, b) => a.name.localeCompare(b.name));

      const total = list.length;
      const offset = params.offset ?? 0;
      const limit = params.limit ?? 20;
      const sliced = list.slice(offset, offset + limit);

      return { restaurants: sliced, total };
    },
  };

  const menuRepo: MenuRepository = {
    async createCategory(data) {
      const category: MenuCategory = {
        id: nextCategoryId(),
        restaurantId: data.restaurantId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
        createdAt: new Date(),
      };
      seedCategory(category);
      return category;
    },

    async findCategoryById(id) {
      return categories.find((c) => c.id === id) ?? null;
    },

    async listCategoriesByRestaurant(restaurantId) {
      return categories
        .filter((c) => c.restaurantId === restaurantId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
    },

    async listCategoriesWithItems(restaurantId) {
      const cats = await menuRepo.listCategoriesByRestaurant(restaurantId);
      return cats.map((cat) => ({
        ...cat,
        items: items
          .filter((i) => i.categoryId === cat.id)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      }));
    },

    async createMenuItem(data) {
      const now = new Date();
      const item: MenuItem = {
        id: nextMenuItemId(),
        restaurantId: data.restaurantId,
        categoryId: data.categoryId ?? null,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        isAvailable: data.isAvailable ?? true,
        createdAt: now,
        updatedAt: now,
      };
      seedMenuItem(item);
      return item;
    },

    async findMenuItemById(id) {
      return items.find((i) => i.id === id) ?? null;
    },

    async listMenuItemsByRestaurant(restaurantId, categoryId) {
      return items
        .filter((i) => i.restaurantId === restaurantId && (categoryId === undefined || i.categoryId === categoryId))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },

    async updateMenuItem(id, data) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      const existing = items[idx]!;
      const updated: MenuItem = {
        ...existing,
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        price: data.price ?? existing.price,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
        isAvailable: data.isAvailable ?? existing.isAvailable,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        updatedAt: new Date(),
      };
      items[idx] = updated;
      return updated;
    },

    async updateMenuItemAvailability(id, isAvailable) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      const existing = items[idx]!;
      const updated: MenuItem = { ...existing, isAvailable, updatedAt: new Date() };
      items[idx] = updated;
      return updated;
    },
  };

  return {
    restaurantRepo,
    menuRepo,
    seedRestaurant,
    seedCategory,
    seedMenuItem,
    getRestaurants: () => restaurants,
    getCategories: () => categories,
    getMenuItems: () => items,
    nextRestaurantId,
    nextCategoryId,
    nextMenuItemId,
    setOwnerRestaurantId(ownerId, restaurantId) {
      const idx = restaurants.findIndex((r) => r.ownerId === ownerId);
      if (idx === -1) {
        seedRestaurant(makeRestaurant(restaurantId, { ownerId }));
      }
    },
    getRestaurantByOwnerId(ownerId) {
      return restaurants.find((r) => r.ownerId === ownerId);
    },
    getRestaurantById(id) {
      return restaurants.find((r) => r.id === id);
    },
    getCategoriesByRestaurantId(restaurantId) {
      return categories.filter((c) => c.restaurantId === restaurantId);
    },
  };
}