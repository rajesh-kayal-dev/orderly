"use client";

import React, { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, ArrowRight } from "lucide-react";
import { useRestaurantDetail } from "@/features/restaurants/hooks/useRestaurantDetail";
import { RestaurantHeader } from "@/features/restaurants/components/RestaurantHeader";
import { MenuCategorySection } from "@/features/restaurants/components/MenuCategorySection";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/utils/format";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";

interface RestaurantDetailPageProps {
  params: Promise<{ restaurantId: string }>;
}

export default function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const resolvedParams = use(params);
  const restaurantId = resolvedParams.restaurantId;

  const { restaurant, categories, isLoading, error, refetch } = useRestaurantDetail(restaurantId);
  const { itemCount, total } = useCart();

  const totalMenuItems = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0);
  }, [categories]);

  if (isLoading) {
    return <LoadingState message="Loading restaurant menu..." className="min-h-[50vh]" />;
  }

  if (error || !restaurant) {
    return (
      <div className="space-y-6">
        <Link
          href="/restaurants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Restaurants
        </Link>
        <ErrorState
          title="Restaurant not found"
          message={error || "Could not find the requested restaurant or menu catalog."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Back Link */}
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Restaurants
      </Link>

      {/* Restaurant Header */}
      <RestaurantHeader restaurant={restaurant} />

      {/* Category Quick Navigation */}
      {categories.length > 0 && (
        <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#category-${cat.id}`}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-500 transition-colors"
            >
              {cat.name} ({cat.items?.length || 0})
            </a>
          ))}
        </div>
      )}

      {/* Menu Categories */}
      {categories.length === 0 || totalMenuItems === 0 ? (
        <EmptyState
          title="No menu items available"
          description="This restaurant currently does not have any active menu items listed. Please check back later!"
        />
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <MenuCategorySection key={category.id} category={category} />
          ))}
        </div>
      )}

      {/* Floating View Cart bar if items are in cart */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in slide-in-from-bottom-6 duration-300">
          <div className="rounded-2xl bg-slate-950 dark:bg-amber-500 text-white dark:text-slate-950 p-4 shadow-2xl border border-slate-800 dark:border-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 dark:bg-slate-950 text-slate-950 dark:text-amber-400 flex items-center justify-center font-extrabold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold opacity-80">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in Cart
                </div>
                <div className="text-base font-extrabold font-mono">{formatPrice(total)}</div>
              </div>
            </div>

            <Link href="/cart">
              <Button
                variant={undefined}
                size="sm"
                className="bg-white dark:bg-slate-950 text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
