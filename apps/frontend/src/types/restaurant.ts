export interface Restaurant {
  id: string | number;
  userId?: string;
  name: string;
  cuisine_type: string;
  address: string;
  phone?: string;
  rating: number;
  delivery_time: string;
  is_open: boolean;
  image_url: string;
}

export interface MenuItem {
  id: string | number;
  restaurant_id: string | number;
  category_id?: string | number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_vegetarian: boolean;
  is_available: boolean;
}

export interface MenuCategory {
  id: string | number;
  restaurantId?: string | number;
  name: string;
  items: MenuItem[];
}
