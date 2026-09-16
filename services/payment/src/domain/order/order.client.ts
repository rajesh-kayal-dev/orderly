import type { Decimal } from "decimal.js";

export interface OrderTotal {
  id: string;
  totalAmount: Decimal;
  paymentStatus: string;
  customerId: string;
}

export interface OrderClient {
  getOrderTotal(orderId: string, authToken: string): Promise<OrderTotal | null>;
}
