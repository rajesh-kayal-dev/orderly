import { apiClient } from "@/lib/api/client";
import type { CreateOrderInput, ListOrdersQuery, Order } from "../types/order.types";

export const ordersApi = {
  createOrder: async (input: CreateOrderInput): Promise<Order> => {
    return apiClient.post<Order>("/orders", input);
  },

  listOrders: async (query?: ListOrdersQuery): Promise<Order[]> => {
    return apiClient.get<Order[]>("/orders", {
      params: {
        limit: query?.limit,
        offset: query?.offset,
        status: query?.status,
      },
    });
  },

  getOrder: async (id: string): Promise<Order> => {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  cancelOrder: async (id: string): Promise<Order> => {
    return apiClient.put<Order>(`/orders/${id}/cancel`);
  },
};
