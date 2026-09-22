"use client";

import { useEffect, useState, useCallback } from "react";
import type { ListOrdersQuery, Order } from "../types/order.types";
import { ordersApi } from "../api/orders.api";
import { useAuth } from "@/lib/auth/auth-context";

export const useOrders = (query?: ListOrdersQuery) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await ordersApi.listOrders(query);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, query]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
};
