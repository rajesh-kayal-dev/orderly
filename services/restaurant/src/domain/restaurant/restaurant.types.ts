export type RestaurantStatus = "ACTIVE" | "INACTIVE";

export type OpeningStatus = "OPEN" | "CLOSED";

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  address: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function getRestaurantStatus(restaurant: Pick<Restaurant, "isActive">): RestaurantStatus {
  return restaurant.isActive ? "ACTIVE" : "INACTIVE";
}

export function getOpeningStatus(restaurant: Pick<Restaurant, "isOpen">): OpeningStatus {
  return restaurant.isOpen ? "OPEN" : "CLOSED";
}