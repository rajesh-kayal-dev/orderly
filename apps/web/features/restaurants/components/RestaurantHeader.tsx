import React from "react";
import { Star, Clock, MapPin, Phone, Mail, Utensils } from "lucide-react";
import type { Restaurant } from "../types/restaurant.types";
import { Badge } from "@/components/ui/Badge";

export interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

export const RestaurantHeader = ({ restaurant }: RestaurantHeaderProps) => {
  const {
    name,
    description,
    cuisineType,
    address,
    city,
    phone,
    email,
    isOpen,
    rating = 4.7,
    deliveryTimeMinutes = 30,
  } = restaurant;

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 border border-slate-800 text-white p-6 sm:p-10 overflow-hidden shadow-xl mb-8">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isOpen ? "success" : "default"} dot size="md">
              {isOpen ? "Open For Orders" : "Currently Closed"}
            </Badge>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              {cuisineType}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{name}</h1>

          {description && (
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">{description}</p>
          )}

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                {address}, {city}
              </span>
            </div>
            {phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{phone}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="flex sm:flex-col gap-3 w-full sm:w-auto self-stretch sm:self-auto">
          <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-lg font-extrabold">{typeof rating === "number" ? rating.toFixed(1) : "4.7"}</div>
              <div className="text-[11px] text-slate-400 font-medium">Customer Rating</div>
            </div>
          </div>

          <div className="flex-1 sm:flex-initial p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-extrabold">{deliveryTimeMinutes} mins</div>
              <div className="text-[11px] text-slate-400 font-medium">Estimated Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
