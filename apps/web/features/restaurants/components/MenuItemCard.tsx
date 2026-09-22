"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Minus, Utensils, Check } from "lucide-react";
import type { MenuItem } from "../types/restaurant.types";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

export interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Find if this item is in the current cart
  const cartItem = items.find((ci) => ci.menuItemId === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      setIsAdding(true);
      await addItem({
        restaurantId: item.restaurantId,
        menuItemId: item.id,
        quantity: 1,
      });
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async () => {
    if (!cartItem) {
      await handleAdd();
      return;
    }
    await updateQuantity(cartItem.id, quantity + 1);
  };

  const handleDecrement = async () => {
    if (!cartItem) return;
    if (quantity <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateQuantity(cartItem.id, quantity - 1);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row justify-between gap-4 transition-all duration-200 hover:border-amber-500/30 hover:shadow-sm">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.name}</h4>
          {!item.isAvailable && (
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Unavailable
            </span>
          )}
        </div>

        <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
          {formatPrice(item.price)}
        </div>

        {item.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
            {item.description}
          </p>
        )}
      </div>

      {/* Action / Quantity Controls */}
      <div className="flex items-center sm:self-center gap-2">
        {quantity > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-colors shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={!item.isAvailable}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-500 flex items-center justify-center transition-colors shadow-xs disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!item.isAvailable}
            isLoading={isAdding}
            leftIcon={
              addedAnimation ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )
            }
            className={
              addedAnimation
                ? "border-emerald-500 text-emerald-500"
                : "hover:border-amber-500 hover:text-amber-500"
            }
          >
            {addedAnimation ? "Added" : "Add to Cart"}
          </Button>
        )}
      </div>
    </div>
  );
};
