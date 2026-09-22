"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, UtensilsCrossed } from "lucide-react";
import { useRestaurants } from "@/features/restaurants/hooks/useRestaurants";
import { RestaurantGrid } from "@/features/restaurants/components/RestaurantGrid";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";

const CUISINES = [
  "All",
  "Burgers",
  "Pizza",
  "Asian",
  "Healthy",
  "Desserts",
  "Beverages",
  "Indian",
  "Italian",
];

function RestaurantListContent() {
  const searchParams = useSearchParams();
  const initialCuisine = searchParams.get("cuisine") || "All";
  const initialSearch = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);
  const [activeOnly, setActiveOnly] = useState(false);

  const { restaurants, isLoading, error, refetch } = useRestaurants({
    activeOnly: false,
  });

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = restaurant.name.toLowerCase().includes(query);
        const matchesCuisine = restaurant.cuisineType.toLowerCase().includes(query);
        const matchesCity = restaurant.city.toLowerCase().includes(query);
        if (!matchesName && !matchesCuisine && !matchesCity) return false;
      }

      // Cuisine filter
      if (selectedCuisine !== "All") {
        if (!restaurant.cuisineType.toLowerCase().includes(selectedCuisine.toLowerCase())) {
          return false;
        }
      }

      // Open only filter
      if (activeOnly && !restaurant.isOpen) {
        return false;
      }

      return true;
    });
  }, [restaurants, searchTerm, selectedCuisine, activeOnly]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCuisine("All");
    setActiveOnly(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore Restaurants
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Discover top eateries and handcrafted culinary dishes around you
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by restaurant name, cuisine, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <span>Open Now Only</span>
            </label>
          </div>
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCuisine === cuisine
                  ? "bg-amber-500 text-slate-950 shadow-xs scale-105"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {error ? (
        <ErrorState
          title="Failed to load restaurants"
          message={error}
          onRetry={() => refetch()}
        />
      ) : (
        <RestaurantGrid
          restaurants={filteredRestaurants}
          isLoading={isLoading}
          onResetSearch={handleResetFilters}
        />
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading restaurants..." />}>
      <RestaurantListContent />
    </Suspense>
  );
}
