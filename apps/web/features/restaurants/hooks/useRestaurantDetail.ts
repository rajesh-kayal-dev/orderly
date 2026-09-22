"use client";

import { useEffect, useState, useCallback } from "react";
import type { FullMenu, MenuCategory, Restaurant } from "../types/restaurant.types";
import { restaurantsApi } from "../api/restaurants.api";

export const useRestaurantDetail = (restaurantId: string) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setIsLoading(true);
      setError(null);
      // Fetch full menu in a single call or fallback to individual calls
      try {
        const fullMenu: FullMenu = await restaurantsApi.getFullMenu(restaurantId);
        if (fullMenu?.restaurant) {
          setRestaurant(fullMenu.restaurant);
          setCategories(fullMenu.categories || []);
          return;
        }
      } catch {
        // Fallback: fetch restaurant and categories separately
      }

      const [restData, catData] = await Promise.all([
        restaurantsApi.getRestaurantById(restaurantId),
        restaurantsApi.getCategories(restaurantId).catch(() => []),
      ]);

      setRestaurant(restData);
      setCategories(catData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load restaurant details");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  return {
    restaurant,
    categories,
    isLoading,
    error,
    refetch: fetchDetails,
  };
};
