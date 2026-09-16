import { Decimal } from "decimal.js";
import type {
  OrderClient,
  OrderTotal,
} from "../../src/domain/order/order.client.js";

export interface FakeOrderClientHandle {
  client: OrderClient;
  setOrder(order: OrderTotal | null): void;
  getFetchCalls(): { orderId: string; authToken: string }[];
}

export function createFakeOrderClient(): FakeOrderClientHandle {
  let order: OrderTotal | null = null;
  const fetchCalls: { orderId: string; authToken: string }[] = [];

  const client: OrderClient = {
    async getOrderTotal(orderId: string, authToken: string): Promise<OrderTotal | null> {
      fetchCalls.push({ orderId, authToken });
      return order;
    },
  };

  return {
    client,
    setOrder(o) {
      order = o;
    },
    getFetchCalls() {
      return fetchCalls;
    },
  };
}

export function makeOrderTotal(overrides: Partial<OrderTotal> = {}): OrderTotal {
  return {
    id: overrides.id ?? "order-1",
    totalAmount: overrides.totalAmount ?? new Decimal("10.00"),
    paymentStatus: overrides.paymentStatus ?? "pending",
    customerId: overrides.customerId ?? "customer-1",
  };
}
