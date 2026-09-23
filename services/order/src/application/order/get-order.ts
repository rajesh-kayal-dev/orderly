import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";
import type { OrderActor } from "./create-order.js";
import { OrderNotFoundError, OrderForbiddenError } from "./errors.js";

export const getOrder =
  (orders: OrderRepository) =>
  async (actor: OrderActor, orderId: string): Promise<Order> => {
    const order = await orders.findOrderById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    // Strict ownership verification on every request
    const isCustomerOwner = Boolean(actor.customerId && order.customerId === actor.customerId);
    const isGuestOwner = Boolean(actor.guestSessionId && order.guestSessionId === actor.guestSessionId);

    if (!isCustomerOwner && !isGuestOwner) {
      throw new OrderForbiddenError();
    }

    return order;
  };
