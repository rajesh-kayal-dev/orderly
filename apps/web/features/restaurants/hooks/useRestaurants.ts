"use client";

import { useEffect, useState, useCallback } from "react";
import type { ListRestaurantsQuery, Restaurant } from "../types/restaurant.types";
import { restaurantsApi } from "../api/restaurants.api";

export const useRestaurants = (initialQuery?: ListRestaurantsQuery) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async (query?: ListRestaurantsQuery) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await restaurantsApi.listRestaurants(query);
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRestaurants(initialQuery);
  }, [fetchRestaurants, initialQuery]);

  return {
    restaurants,
    isLoading,
    error,
    refetch: fetchRestaurants,
  };
};
