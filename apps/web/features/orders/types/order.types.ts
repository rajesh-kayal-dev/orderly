export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  specialInstructions?: string | null;
  name?: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  totalAmount: number | string;
  deliveryAddress: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderInput {
  deliveryAddress: string;
  notes?: string;
}

export interface ListOrdersQuery {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
}
