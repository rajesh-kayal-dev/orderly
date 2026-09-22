import { apiClient } from "@/lib/api/client";
import type { AddToCartInput, Cart } from "../types/cart.types";

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    return apiClient.get<Cart>("/cart");
  },

  addItem: async (input: AddToCartInput): Promise<Cart> => {
    return apiClient.post<Cart>("/cart/items", input);
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<Cart> => {
    return apiClient.put<Cart>(`/cart/items/${itemId}`, { quantity });
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    return apiClient.delete<Cart>(`/cart/items/${itemId}`);
  },

  clearCart: async (): Promise<Cart> => {
    return apiClient.delete<Cart>("/cart");
  },
};
