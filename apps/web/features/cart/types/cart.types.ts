export interface CartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number | string;
  specialInstructions?: string | null;
  name?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  restaurantId: string | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartInput {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}
