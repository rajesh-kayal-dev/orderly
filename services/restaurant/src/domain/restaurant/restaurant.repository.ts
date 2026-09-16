import type { Restaurant } from "./restaurant.types.js";

export interface CreateRestaurantData {
  ownerId: string;
  name: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  opensAt?: string;
  closesAt?: string;
}

export interface UpdateRestaurantData {
  name?: string;
  description?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  opensAt?: string | null;
  closesAt?: string | null;
}

export interface ListRestaurantsParams {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListRestaurantsResult {
  restaurants: Restaurant[];
  total: number;
}

export interface RestaurantRepository {
  create(data: CreateRestaurantData): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;
  update(id: string, data: UpdateRestaurantData): Promise<Restaurant | null>;
  updateOpenState(id: string, isOpen: boolean): Promise<Restaurant | null>;
  list(params: ListRestaurantsParams): Promise<ListRestaurantsResult>;
}