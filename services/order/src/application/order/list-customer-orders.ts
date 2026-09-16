import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";

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
  async (customerId: string, params: ListOrdersParams): Promise<ListCustomerOrdersResult> =>
    orders.listOrdersByCustomer(customerId, params);