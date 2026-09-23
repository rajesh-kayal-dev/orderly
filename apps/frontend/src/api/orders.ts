import apiClient from './client';
import type { CartItem } from '../types/cart';
import type { Order } from '../types/order';

export { cartApi } from './cart';

export const orderApi = {
  createOrder: async (data: {
    delivery_address?: string;
    deliveryAddress?: { street: string; city: string };
    notes?: string;
    items?: any[];
    payment_method?: 'cod' | 'razorpay';
  }): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.post<{ success: boolean; data: Order }>('/orders', data);
    return res.data;
  },

  getCustomerOrders: async (): Promise<{ success: boolean; data: Order[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; data: Order[]; total: number }>('/orders');
    return res.data;
  },

  getOrderById: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return res.data;
  },

  cancelOrder: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.put<{ success: boolean; data: Order }>(`/orders/${id}/cancel`);
    return res.data;
  },

  getRestaurantOrders: async (): Promise<{ success: boolean; data: Order[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; data: Order[]; total: number }>('/restaurant/orders');
    return res.data;
  },

  acceptOrder: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.put<{ success: boolean; data: Order }>(`/restaurant/orders/${id}/accept`);
    return res.data;
  },

  rejectOrder: async (id: string, reason?: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.put<{ success: boolean; data: Order }>(`/restaurant/orders/${id}/reject`, { reason });
    return res.data;
  },

  prepareOrder: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.put<{ success: boolean; data: Order }>(`/restaurant/orders/${id}/prepare`);
    return res.data;
  },

  markReady: async (id: string): Promise<{ success: boolean; data: Order }> => {
    const res = await apiClient.put<{ success: boolean; data: Order }>(`/restaurant/orders/${id}/ready`);
    return res.data;
  },
};
