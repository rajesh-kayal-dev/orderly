import type { Order, OrderStatus } from "../../domain/order/order.types.js";

/**
 * Publishes Order lifecycle facts after the corresponding Order persistence
 * operation has succeeded. Implementations are infrastructure concerns.
 */
export interface OrderEventPublisher {
  publishOrderPlaced(order: Order): Promise<void>;
  publishOrderStatusChanged(order: Order, previousStatus: OrderStatus): Promise<void>;
}
