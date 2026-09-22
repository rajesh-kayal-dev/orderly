"use client";

import { useEffect, useState, useCallback } from "react";
import type { Order } from "../types/order.types";
import { ordersApi } from "../api/orders.api";
import { useAuth } from "@/lib/auth/auth-context";

export const useOrderDetail = (orderId: string) => {
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await ordersApi.getOrder(orderId);
      setOrder(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, orderId]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const cancelOrder = useCallback(async (): Promise<Order | null> => {
    if (!orderId) return null;
    try {
      const updated = await ordersApi.cancelOrder(orderId);
      setOrder(updated);
      return updated;
    } catch (err: unknown) {
      throw err;
    }
  }, [orderId]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
    cancelOrder,
  };
};
