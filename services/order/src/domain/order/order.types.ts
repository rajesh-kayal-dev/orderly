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

export type PaymentMethod = "cod" | "online" | "vnpay" | "razorpay";

export interface ContactInfoSnapshot {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
}

export interface DeliveryAddressSnapshot {
  street: string;
  landmark?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

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
  customerId: string | null;
  guestSessionId: string | null;
  restaurantId: string;
  deliveryAddressId: string | null;
  deliveryAddress: DeliveryAddressSnapshot | unknown | null;
  contactInfo: ContactInfoSnapshot | unknown | null;
  notes: string | null;
  idempotencyKey?: string | null;
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

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled"],
  assigned: [],
  picked_up: [],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}
