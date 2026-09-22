"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { AddToCartInput, Cart, CartItem } from "@/features/cart/types/cart.types";
import { cartApi } from "@/features/cart/api/cart.api";
import { useAuth } from "@/lib/auth/auth-context";

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isLoading: boolean;
  addItem: (input: AddToCartInput) => Promise<Cart>;
  updateQuantity: (itemId: string, quantity: number) => Promise<Cart>;
  removeItem: (itemId: string) => Promise<Cart>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch (error) {
      console.warn("Could not load cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const items = useMemo(() => cart?.items || [], [cart]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice || 0),
        0,
      ),
    [items],
  );

  const deliveryFee = useMemo(() => (items.length > 0 ? 40 : 0), [items]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  const addItem = useCallback(async (input: AddToCartInput): Promise<Cart> => {
    setIsLoading(true);
    try {
      const updated = await cartApi.addItem(input);
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<Cart> => {
      setIsLoading(true);
      try {
        if (quantity <= 0) {
          const updated = await cartApi.removeItem(itemId);
          setCart(updated);
          return updated;
        }
        const updated = await cartApi.updateQuantity(itemId, quantity);
        setCart(updated);
        return updated;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeItem = useCallback(async (itemId: string): Promise<Cart> => {
    setIsLoading(true);
    try {
      const updated = await cartApi.removeItem(itemId);
      setCart(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await cartApi.clearCart();
      setCart((prev) => (prev ? { ...prev, items: [] } : null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      cart,
      items,
      itemCount,
      subtotal,
      deliveryFee,
      total,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [
      cart,
      items,
      itemCount,
      subtotal,
      deliveryFee,
      total,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
