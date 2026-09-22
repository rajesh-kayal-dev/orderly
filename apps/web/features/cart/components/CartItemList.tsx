"use client";

import React from "react";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import type { CartItem } from "../types/cart.types";
import { useCart } from "../hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { EmptyState } from "@/components/feedback/EmptyState";
import Link from "next/link";

export const CartItemList = () => {
  const { items, updateQuantity, removeItem, clearCart, isLoading } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-8 h-8 text-amber-500" />}
        title="Your cart is empty"
        description="Looks like you haven't added any delicious food items to your cart yet."
        actionLabel="Explore Restaurants"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Order Items ({items.length})
        </h2>
        <button
          onClick={() => clearCart()}
          className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {items.map((item) => {
          const itemTotal = Number(item.unitPrice || 0) * item.quantity;

          return (
            <div
              key={item.id}
              className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  {item.name || `Menu Item (${item.menuItemId.slice(0, 8)}...)`}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{formatPrice(item.unitPrice)} each</span>
                  {item.specialInstructions && (
                    <span className="italic text-amber-600 dark:text-amber-400">
                      &quot;{item.specialInstructions}&quot;
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-colors shadow-xs"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-colors shadow-xs"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white min-w-[60px] text-right">
                    {formatPrice(itemTotal)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
