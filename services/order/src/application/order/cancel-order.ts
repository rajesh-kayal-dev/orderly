import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";
import { isCancellableStatus } from "../../domain/order/order.types.js";
import { OrderForbiddenError, OrderNotFoundError, OrderStateConflictError } from "./errors.js";
import type { OrderEventPublisher } from "./order-event.publisher.js";

export const cancelOrder =
  (orders: OrderRepository, eventPublisher: OrderEventPublisher) =>
  async (customerId: string, orderId: string): Promise<Order> => {
    const order = await orders.findOrderById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.customerId !== customerId) {
      throw new OrderForbiddenError();
    }

    if (!isCancellableStatus(order.status)) {
      throw new OrderStateConflictError(order.status);
    }

    const updated = await orders.updateOrderStatus(orderId, "cancelled");

    if (!updated) {
      throw new OrderNotFoundError();
    }

    await orders.updateOrderPaymentStatus(orderId, "cancelled");

    const refreshed = await orders.findOrderById(orderId);
    const result = refreshed ?? updated;
    await eventPublisher.publishOrderStatusChanged(result, order.status);
    return result;
  };
