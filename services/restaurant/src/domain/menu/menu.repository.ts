import { Decimal } from "decimal.js";
import type { MenuCategory, MenuCategoryWithItems, MenuItem } from "./menu.types.js";

export interface CreateMenuCategoryData {
  restaurantId: string;
  name: string;
  sortOrder?: number;
}

export interface CreateMenuItemData {
  restaurantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: Decimal;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateMenuItemData {
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  price?: Decimal;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export interface MenuRepository {
  createCategory(data: CreateMenuCategoryData): Promise<MenuCategory>;
  findCategoryById(id: string): Promise<MenuCategory | null>;
  listCategoriesByRestaurant(restaurantId: string): Promise<MenuCategory[]>;
  listCategoriesWithItems(restaurantId: string): Promise<MenuCategoryWithItems[]>;
  createMenuItem(data: CreateMenuItemData): Promise<MenuItem>;
  findMenuItemById(id: string): Promise<MenuItem | null>;
  listMenuItemsByRestaurant(restaurantId: string, categoryId?: string): Promise<MenuItem[]>;
  updateMenuItem(id: string, data: UpdateMenuItemData): Promise<MenuItem | null>;
  updateMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem | null>;
}