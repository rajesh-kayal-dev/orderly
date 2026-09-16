import type { OrderStatus } from "../../domain/order/order.types.js";

export class RestaurantNotFoundError extends Error {
  constructor() {
    super("Restaurant not found");
    this.name = "RestaurantNotFoundError";
  }
}

export class RestaurantClosedError extends Error {
  constructor() {
    super("Restaurant is currently closed");
    this.name = "RestaurantClosedError";
  }
}

export class MenuItemNotFoundError extends Error {
  constructor() {
    super("Menu item not found");
    this.name = "MenuItemNotFoundError";
  }
}

export class MenuItemUnavailableError extends Error {
  constructor() {
    super("Menu item is currently unavailable");
    this.name = "MenuItemUnavailableError";
  }
}

export class CartItemQuantityLimitError extends Error {
  constructor(maxQuantity: number) {
    super(`Maximum quantity per item is ${maxQuantity}`);
    this.name = "CartItemQuantityLimitError";
  }
}

export class CartEmptyError extends Error {
  constructor() {
    super("Cart is empty");
    this.name = "CartEmptyError";
  }
}

export class CartItemNotFoundError extends Error {
  constructor() {
    super("Cart item not found");
    this.name = "CartItemNotFoundError";
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super("Order not found");
    this.name = "OrderNotFoundError";
  }
}

export class OrderForbiddenError extends Error {
  constructor() {
    super("Not authorized to access this order");
    this.name = "OrderForbiddenError";
  }
}

export class OrderStateConflictError extends Error {
  constructor(status: OrderStatus) {
    super(`Cannot cancel order in ${status} status`);
    this.name = "OrderStateConflictError";
  }
}

export class OrderStatusTransitionError extends Error {
  constructor(current: OrderStatus, target: OrderStatus) {
    super(`Cannot change order status from ${current} to ${target}`);
    this.name = "OrderStatusTransitionError";
  }
}

export class RestaurantOwnershipError extends Error {
  constructor() {
    super("Restaurant profile does not exist for this user");
    this.name = "RestaurantOwnershipError";
  }
}
