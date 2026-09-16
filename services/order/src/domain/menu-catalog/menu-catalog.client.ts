import type { Decimal } from "decimal.js";

export interface MenuCatalogRestaurant {
  id: string;
  name: string;
  isActive: boolean;
  isOpen: boolean;
}

export interface MenuCatalogItem {
  id: string;
  restaurantId: string;
  name: string;
  price: Decimal;
  isAvailable: boolean;
}

export interface MenuCatalogClient {
  getRestaurant(restaurantId: string): Promise<MenuCatalogRestaurant | null>;
  listMenuItems(restaurantId: string): Promise<MenuCatalogItem[]>;
}