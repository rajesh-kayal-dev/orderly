import type { Decimal } from "decimal.js";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";

export type PaymentMethod = "cod";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: Decimal;
  subtotal: Decimal;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  deliveryAddressId: string | null;
  deliveryAddress: unknown | null;
  notes: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: Decimal;
  deliveryFee: Decimal;
  totalAmount: Decimal;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export const CANCELLABLE_STATUSES: readonly OrderStatus[] = ["placed", "accepted"];

export function isCancellableStatus(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}