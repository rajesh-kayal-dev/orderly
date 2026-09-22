export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  cuisineType: string;
  address: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  isOpen: boolean;
  rating?: number;
  deliveryTimeMinutes?: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number | string;
  isAvailable: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items?: MenuItem[];
}

export interface FullMenu {
  restaurant: Restaurant;
  categories: MenuCategory[];
}

export interface ListRestaurantsQuery {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}
