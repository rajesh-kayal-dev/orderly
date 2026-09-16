import { Decimal } from "decimal.js";

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: Decimal;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}