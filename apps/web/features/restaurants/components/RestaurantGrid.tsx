import React from "react";
import type { Restaurant } from "../types/restaurant.types";
import { RestaurantCard } from "./RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { UtensilsCrossed } from "lucide-react";

export interface RestaurantGridProps {
  restaurants: Restaurant[];
  isLoading?: boolean;
  onResetSearch?: () => void;
}

export const RestaurantGrid = ({
  restaurants,
  isLoading = false,
  onResetSearch,
}: RestaurantGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 h-80 animate-pulse flex flex-col justify-between p-4"
          >
            <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
            <div className="space-y-2 mt-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mt-3" />
          </div>
        ))}
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <EmptyState
        icon={<UtensilsCrossed className="w-8 h-8 text-amber-500" />}
        title="No restaurants found"
        description="We couldn't find any restaurants matching your current criteria. Try adjusting your search query or filters."
        actionLabel={onResetSearch ? "Clear Filters" : undefined}
        onAction={onResetSearch}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
};
