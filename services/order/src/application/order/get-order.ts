import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";
import { OrderNotFoundError, OrderForbiddenError } from "./errors.js";

export const getOrder =
  (orders: OrderRepository) =>
  async (customerId: string, orderId: string): Promise<Order> => {
    const order = await orders.findOrderById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.customerId !== customerId) {
      throw new OrderForbiddenError();
    }

    return order;
  };