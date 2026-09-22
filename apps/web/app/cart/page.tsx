"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { CartItemList } from "@/features/cart/components/CartItemList";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/cart");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (cartLoading && items.length === 0)) {
    return <LoadingState message="Loading your cart..." className="min-h-[50vh]" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-amber-500" />
            Your Food Cart
          </h1>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-amber-500" />}
          title="Your cart is empty"
          description="You have no items in your cart. Explore our selection of restaurants and add tasty meals to get started!"
          actionLabel="Browse Restaurants"
          onAction={() => router.push("/restaurants")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <CartItemList />
          </div>

          {/* Checkout & Summary Panel */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
