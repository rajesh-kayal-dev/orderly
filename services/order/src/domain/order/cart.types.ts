export const MAX_QUANTITY = 20;

export interface CartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  customerId: string | null;
  guestSessionId: string | null;
  restaurantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
}

export interface CartView {
  cartId: string | null;
  restaurantId: string | null;
  items: CartItemView[];
}

export interface CartItemView {
  id: string;
  menuItemId: string;
  quantity: number;
}

export function cartToView(cart: Cart): CartView {
  return {
    cartId: cart.id,
    restaurantId: cart.restaurantId,
    items: cart.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    })),
  };
}

export function emptyCartView(): CartView {
  return { cartId: null, restaurantId: null, items: [] };
}
