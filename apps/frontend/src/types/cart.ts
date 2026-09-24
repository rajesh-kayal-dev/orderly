export interface CartItem {
  id?: string | number;
  cartItemId?: string | number;
  menuItemId?: string | number;
  name: string;
  price: number;
  quantity: number;
  restaurant_id?: string | number;
  image?: string;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  restaurantId: string | number | null;
  total: number;
  loading: boolean;
  error: string | null;
}
