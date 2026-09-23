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

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string | number;
  delivery_partner_id?: string | null;
  status: OrderStatus;
  delivery_address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  platform_fee: number;
  tax: number;
  total: number;
  payment_status: 'paid' | 'pending' | 'failed';
  payment_method: 'cod' | 'razorpay';
  created_at: string;
  updated_at: string;
}
