import { Decimal } from "decimal.js";
import type { CartRepository, CartItemWithOwner } from "../../src/domain/order/cart.repository.js";
import type { Cart, CartItem } from "../../src/domain/order/cart.types.js";
import type {
  CreateOrderData,
  ListOrdersParams,
  ListOrdersResult,
  OrderRepository,
} from "../../src/domain/order/order.repository.js";
import type {
  MenuCatalogClient,
  MenuCatalogItem,
  MenuCatalogRestaurant,
} from "../../src/domain/menu-catalog/menu-catalog.client.js";
import type { Order, OrderStatus, PaymentStatus } from "../../src/domain/order/order.types.js";

let cartSeq = 0;
let cartItemSeq = 0;
let orderSeq = 0;
let orderItemSeq = 0;

export function makeCartItem(id: string, cartId: string, menuItemId: string, quantity: number): CartItem {
  const now = new Date();
  return { id, cartId, menuItemId, quantity, createdAt: now, updatedAt: now };
}

export function makeCart(id: string, customerId: string, restaurantId: string | null, items: CartItem[]): Cart {
  const now = new Date();
  return { id, customerId, restaurantId, createdAt: now, updatedAt: now, items };
}

export function makeOrder(id: string, overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id,
    customerId: overrides.customerId ?? "customer-1",
    restaurantId: overrides.restaurantId ?? "rest-1",
    deliveryAddressId: overrides.deliveryAddressId ?? null,
    deliveryAddress: overrides.deliveryAddress ?? null,
    notes: overrides.notes ?? null,
    status: overrides.status ?? "placed",
    paymentStatus: overrides.paymentStatus ?? "pending",
    paymentMethod: overrides.paymentMethod ?? "cod",
    subtotal: overrides.subtotal ?? new Decimal("0.00"),
    deliveryFee: overrides.deliveryFee ?? new Decimal("0.00"),
    totalAmount: overrides.totalAmount ?? new Decimal("0.00"),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    items: overrides.items ?? [],
  };
}

export function makeRestaurant(
  id: string,
  overrides: Partial<MenuCatalogRestaurant> = {},
): MenuCatalogRestaurant {
  return {
    id,
    name: overrides.name ?? `Restaurant ${id}`,
    isActive: overrides.isActive ?? true,
    isOpen: overrides.isOpen ?? true,
  };
}

export function makeMenuItem(id: string, overrides: Partial<MenuCatalogItem> = {}): MenuCatalogItem {
  return {
    id,
    restaurantId: overrides.restaurantId ?? "rest-1",
    name: overrides.name ?? `Item ${id}`,
    price: overrides.price ?? new Decimal("10.00"),
    isAvailable: overrides.isAvailable ?? true,
  };
}

export interface FakeRepositoryHandle {
  cartRepo: CartRepository;
  orderRepo: OrderRepository;
  catalogClient: MenuCatalogClient;
  seedCart(cart: Cart): void;
  seedCartItem(item: CartItem): void;
  updateCartItem(item: CartItem): void;
  seedOrder(order: Order): void;
  seedOrderItem(orderId: string, item: Order["items"][number]): void;
  seedRestaurant(view: MenuCatalogRestaurant): void;
  seedMenuItem(view: MenuCatalogItem): void;
  getCarts(): Cart[];
  getOrders(): Order[];
  getRestaurants(): MenuCatalogRestaurant[];
  getMenuItems(): MenuCatalogItem[];
  nextCartId(): string;
  nextCartItemId(): string;
  nextOrderId(): string;
}

export function createFakeRepositories(): FakeRepositoryHandle {
  const carts: Cart[] = [];
  const cartItems: CartItem[] = [];
  const orders: Order[] = [];
  const restaurants: MenuCatalogRestaurant[] = [];
  const menuItems: MenuCatalogItem[] = [];

  const nextCartId = (): string => `cart-${++cartSeq}`;
  const nextCartItemId = (): string => `cart-item-${++cartItemSeq}`;
  const nextOrderId = (): string => `order-${++orderSeq}`;
  const nextOrderItemId = (): string => `order-item-${++orderItemSeq}`;

  function hydrateCart(cartId: string): Cart | null {
    const stored = carts.find((c) => c.id === cartId) ?? null;
    if (!stored) return null;
    return makeCart(
      stored.id,
      stored.customerId,
      stored.restaurantId,
      cartItems
        .filter((i) => i.cartId === cartId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    );
  }

  const cartRepo: CartRepository = {
    async findCartByCustomer(customerId) {
      const cart = carts.find((c) => c.customerId === customerId) ?? null;
      return cart ? hydrateCart(cart.id) : null;
    },

    async findCartById(cartId) {
      return hydrateCart(cartId);
    },

    async createCart(customerId, restaurantId) {
      const cart = makeCart(nextCartId(), customerId, restaurantId, []);
      carts.push(cart);
      return cart;
    },

    async updateCartRestaurant(cartId, restaurantId) {
      const idx = carts.findIndex((c) => c.id === cartId);
      if (idx === -1) throw new Error("Cart not found");
      carts[idx] = { ...carts[idx]!, restaurantId };
    },

    async findCartItem(cartId, menuItemId) {
      return (
        cartItems.find((i) => i.cartId === cartId && i.menuItemId === menuItemId) ?? null
      );
    },

    async createCartItem(cartId, menuItemId, quantity) {
      const item = makeCartItem(nextCartItemId(), cartId, menuItemId, quantity);
      cartItems.push(item);
      return item;
    },

    async setCartItemQuantity(itemId, quantity) {
      const idx = cartItems.findIndex((i) => i.id === itemId);
      if (idx === -1) throw new Error("Cart item not found");
      cartItems[idx] = { ...cartItems[idx]!, quantity, updatedAt: new Date() };
    },

    async deleteCartItem(itemId) {
      const idx = cartItems.findIndex((i) => i.id === itemId);
      if (idx !== -1) cartItems.splice(idx, 1);
    },

    async clearCartItems(cartId) {
      for (let i = cartItems.length - 1; i >= 0; i--) {
        if (cartItems[i]!.cartId === cartId) cartItems.splice(i, 1);
      }
    },

    async findCartItemWithOwner(itemId) {
      const item = cartItems.find((i) => i.id === itemId) ?? null;
      if (!item) return null;
      const cart = carts.find((c) => c.id === item.cartId);
      if (!cart) return null;
      const owner: CartItemWithOwner = {
        ...item,
        cart: { id: cart.id, customerId: cart.customerId },
      };
      return owner;
    },
  };

  const orderRepo: OrderRepository = {
    async createOrder(data: CreateOrderData) {
      const now = new Date();
      const orderId = nextOrderId();
      const order: Order = makeOrder(orderId, {
        customerId: data.customerId,
        restaurantId: data.restaurantId,
        deliveryAddressId: data.deliveryAddressId,
        deliveryAddress: data.deliveryAddress as Order["deliveryAddress"],
        notes: data.notes,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        totalAmount: data.totalAmount,
        items: data.items.map((item) => ({
          id: `order-item-${++orderItemSeq}`,
          orderId,
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });
      orders.push(order);
      return order;
    },

    async findOrderById(id) {
      return orders.find((o) => o.id === id) ?? null;
    },

    async listOrdersByCustomer(customerId, params: ListOrdersParams) {
      const owned = orders
        .filter((o) => o.customerId === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const total = owned.length;
      const sliced = owned.slice(params.offset, params.offset + params.limit);
      return { orders: sliced, total } satisfies ListOrdersResult;
    },

    async updateOrderStatus(id: string, status: OrderStatus) {
      const idx = orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      const updated = { ...orders[idx]!, status, updatedAt: new Date() };
      orders[idx] = updated;
      return updated;
    },

    async updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus) {
      const idx = orders.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      const updated = { ...orders[idx]!, paymentStatus, updatedAt: new Date() };
      orders[idx] = updated;
      return updated;
    },
  };

  const catalogClient: MenuCatalogClient = {
    async getRestaurant(restaurantId) {
      return restaurants.find((r) => r.id === restaurantId) ?? null;
    },

    async listMenuItems(restaurantId) {
      return menuItems.filter((i) => i.restaurantId === restaurantId);
    },
  };

  return {
    cartRepo,
    orderRepo,
    catalogClient,
    seedCart(cart) {
      const idx = carts.findIndex((c) => c.id === cart.id);
      if (idx === -1) carts.push(cart);
      else carts[idx] = cart;
    },
    seedCartItem(item) {
      const idx = cartItems.findIndex((i) => i.id === item.id);
      if (idx === -1) cartItems.push(item);
      else cartItems[idx] = item;
    },
    updateCartItem(item) {
      const idx = cartItems.findIndex((i) => i.id === item.id);
      if (idx === -1) return;
      cartItems[idx] = item;
    },
    seedOrder(order) {
      const idx = orders.findIndex((o) => o.id === order.id);
      if (idx === -1) orders.push(order);
      else orders[idx] = order;
    },
    seedOrderItem(orderId, item) {
      const order = orders.find((o) => o.id === orderId);
      if (order) order.items = [...order.items, item];
    },
    seedRestaurant(view) {
      const idx = restaurants.findIndex((r) => r.id === view.id);
      if (idx === -1) restaurants.push(view);
      else restaurants[idx] = view;
    },
    seedMenuItem(view) {
      const idx = menuItems.findIndex((i) => i.id === view.id);
      if (idx === -1) menuItems.push(view);
      else menuItems[idx] = view;
    },
    getCarts: () => carts,
    getOrders: () => orders,
    getRestaurants: () => restaurants,
    getMenuItems: () => menuItems,
    nextCartId,
    nextCartItemId,
    nextOrderId,
  };
}