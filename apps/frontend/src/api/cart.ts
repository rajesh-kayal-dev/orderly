import apiClient from './client';
import type { CartItem } from '../types/cart';

export const cartApi = {
  getCart: async (): Promise<{ success: boolean; data: { customerId: string; restaurantId: string | null; items: CartItem[] } }> => {
    const res = await apiClient.get('/cart');
    return res.data;
  },

  addItem: async (itemData: { menuItemId?: string | number; quantity: number; notes?: string; item?: any }): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.post('/cart/items', itemData);
    return res.data;
  },

  updateQuantity: async (itemId: string | number, quantity: number): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },

  removeItem: async (itemId: string | number): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  clearCart: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.delete('/cart');
    return res.data;
  },
};

export default cartApi;
