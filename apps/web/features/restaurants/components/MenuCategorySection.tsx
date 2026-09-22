import React from "react";
import type { MenuCategory } from "../types/restaurant.types";
import { MenuItemCard } from "./MenuItemCard";

export interface MenuCategorySectionProps {
  category: MenuCategory;
}

export const MenuCategorySection = ({ category }: MenuCategorySectionProps) => {
  const items = category.items || [];

  if (items.length === 0) return null;

  return (
    <section className="space-y-3 mb-8" id={`category-${category.id}`}>
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{category.name}</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};
