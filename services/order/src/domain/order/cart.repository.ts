import type { Cart, CartItem } from "./cart.types.js";

export interface CartItemWithOwner extends CartItem {
  cart: {
    id: string;
    customerId: string | null;
    guestSessionId: string | null;
  };
}

export interface CartRepository {
  findCartByCustomer(customerId: string): Promise<Cart | null>;
  findCartByGuestSession(guestSessionId: string): Promise<Cart | null>;
  findCartById(cartId: string): Promise<Cart | null>;
  createCart(owner: { customerId?: string | null; guestSessionId?: string | null }, restaurantId: string | null): Promise<Cart>;
  updateCartRestaurant(cartId: string, restaurantId: string | null): Promise<void>;
  findCartItem(cartId: string, menuItemId: string): Promise<CartItem | null>;
  createCartItem(cartId: string, menuItemId: string, quantity: number): Promise<CartItem>;
  setCartItemQuantity(itemId: string, quantity: number): Promise<void>;
  deleteCartItem(itemId: string): Promise<void>;
  clearCartItems(cartId: string): Promise<void>;
  findCartItemWithOwner(itemId: string): Promise<CartItemWithOwner | null>;
}
