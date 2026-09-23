import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";
import type { OrderActor } from "./create-order.js";

export interface ListCustomerOrdersResult {
  orders: Order[];
  total: number;
}

export interface ListOrdersParams {
  limit: number;
  offset: number;
}

export const listCustomerOrders =
  (orders: OrderRepository) =>
  async (actor: OrderActor, params: ListOrdersParams): Promise<ListCustomerOrdersResult> => {
    if (actor.customerId) {
      return orders.listOrdersByCustomer(actor.customerId, params);
    }
    if (actor.guestSessionId) {
      return orders.listOrdersByGuestSession(actor.guestSessionId, params);
    }
    return { orders: [], total: 0 };
  };
