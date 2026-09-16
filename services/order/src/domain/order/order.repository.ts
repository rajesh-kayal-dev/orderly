import type { Decimal } from "decimal.js";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "./order.types.js";

export interface CreateOrderItemData {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: Decimal;
  subtotal: Decimal;
}

export interface CreateOrderData {
  customerId: string;
  restaurantId: string;
  deliveryAddressId: string | null;
  deliveryAddress: unknown | null;
  notes: string | null;
  subtotal: Decimal;
  deliveryFee: Decimal;
  totalAmount: Decimal;
  items: CreateOrderItemData[];
}

export interface ListOrdersParams {
  limit: number;
  offset: number;
}

export interface ListOrdersResult {
  orders: Order[];
  total: number;
}

export interface OrderRepository {
  createOrder(data: CreateOrderData): Promise<Order>;
  findOrderById(id: string): Promise<Order | null>;
  listOrdersByCustomer(customerId: string, params: ListOrdersParams): Promise<ListOrdersResult>;
  listOrdersByRestaurant(restaurantId: string, params: ListOrdersParams): Promise<ListOrdersResult>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null>;
  updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null>;
}

export type OrderWithItems = Order;

export type { OrderItem };