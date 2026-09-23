import type { Decimal } from "decimal.js";
import type { ContactInfoSnapshot, DeliveryAddressSnapshot, Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from "./order.types.js";

export interface CreateOrderItemData {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: Decimal;
  subtotal: Decimal;
}

export interface CreateOrderData {
  customerId?: string | null;
  guestSessionId?: string | null;
  restaurantId: string;
  deliveryAddressId?: string | null;
  deliveryAddress?: DeliveryAddressSnapshot | unknown | null;
  contactInfo?: ContactInfoSnapshot | unknown | null;
  notes?: string | null;
  idempotencyKey?: string | null;
  paymentMethod?: PaymentMethod;
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
  findOrderByIdempotencyKey(key: string): Promise<Order | null>;
  listOrdersByCustomer(customerId: string, params: ListOrdersParams): Promise<ListOrdersResult>;
  listOrdersByGuestSession(guestSessionId: string, params: ListOrdersParams): Promise<ListOrdersResult>;
  listOrdersByRestaurant(restaurantId: string, params: ListOrdersParams): Promise<ListOrdersResult>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null>;
  updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null>;
}

export type OrderWithItems = Order;

export type { OrderItem };
