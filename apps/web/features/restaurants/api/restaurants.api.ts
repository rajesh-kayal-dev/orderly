import { apiClient } from "@/lib/api/client";
import type {
  FullMenu,
  ListRestaurantsQuery,
  MenuCategory,
  MenuItem,
  Restaurant,
} from "../types/restaurant.types";

export const restaurantsApi = {
  listRestaurants: async (query?: ListRestaurantsQuery): Promise<Restaurant[]> => {
    return apiClient.get<Restaurant[]>("/restaurants", {
      params: {
        search: query?.search,
        activeOnly: query?.activeOnly ?? true,
        limit: query?.limit,
        offset: query?.offset,
      },
    });
  },

  getRestaurantById: async (id: string): Promise<Restaurant> => {
    return apiClient.get<Restaurant>(`/restaurants/${id}`);
  },

  getFullMenu: async (restaurantId: string): Promise<FullMenu> => {
    return apiClient.get<FullMenu>(`/menu/full/${restaurantId}`);
  },

  getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
    return apiClient.get<MenuCategory[]>(`/menu/categories/${restaurantId}`);
  },

  getMenuItems: async (restaurantId: string, categoryId?: string): Promise<MenuItem[]> => {
    return apiClient.get<MenuItem[]>("/menu", {
      params: {
        restaurantId,
        categoryId,
      },
    });
  },
};
