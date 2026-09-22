import React from "react";
import Link from "next/link";
import { Star, Clock, MapPin, Utensils } from "lucide-react";
import type { Restaurant } from "../types/restaurant.types";
import { Badge } from "@/components/ui/Badge";

export interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const {
    id,
    name,
    description,
    cuisineType,
    address,
    city,
    isOpen,
    rating = 4.6,
    deliveryTimeMinutes = 30,
  } = restaurant;

  return (
    <Link
      href={`/restaurants/${id}`}
      className="group block rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        {/* Card Image Banner */}
        <div className="relative h-48 w-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors" />
          <Utensils className="w-16 h-16 text-amber-500/40 group-hover:scale-110 transition-transform duration-500" />

          {/* Status Badge */}
          <div className="absolute top-3.5 left-3.5">
            <Badge variant={isOpen ? "success" : "default"} dot size="sm">
              {isOpen ? "Open Now" : "Closed"}
            </Badge>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3.5 right-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{typeof rating === "number" ? rating.toFixed(1) : "4.5"}</span>
          </div>

          {/* Estimated Delivery Time */}
          <div className="absolute bottom-3.5 left-3.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{deliveryTimeMinutes} mins</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
              {name}
            </h3>
          </div>

          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wider">
            {cuisineType || "Multi-cuisine"}
          </p>

          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Footer / Location */}
      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">
          {address ? `${address}, ${city}` : city || "Indore"}
        </span>
      </div>
    </Link>
  );
};
