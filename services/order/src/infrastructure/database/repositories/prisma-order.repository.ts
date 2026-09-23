import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateOrderData,
  ListOrdersParams,
  ListOrdersResult,
  OrderRepository,
} from "../../../domain/order/order.repository.js";
import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from "../../../domain/order/order.types.js";

const safeOrderItemSelect = {
  id: true,
  orderId: true,
  menuItemId: true,
  menuItemName: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
} satisfies Prisma.OrderItemSelect;

const safeOrderSelect = {
  id: true,
  customerId: true,
  guestSessionId: true,
  restaurantId: true,
  deliveryAddressId: true,
  deliveryAddress: true,
  contactInfo: true,
  notes: true,
  idempotencyKey: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  subtotal: true,
  deliveryFee: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

type OrderItemRow = {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
};

type OrderRow = {
  id: string;
  customerId: string | null;
  guestSessionId: string | null;
  restaurantId: string;
  deliveryAddressId: string | null;
  deliveryAddress: Prisma.JsonValue;
  contactInfo: Prisma.JsonValue;
  notes: string | null;
  idempotencyKey: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRow[];
};

function toOrderItem(item: OrderItemRow): OrderItem {
  return {
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  };
}

function toOrder(order: OrderRow): Order {
  return {
    id: order.id,
    customerId: order.customerId,
    guestSessionId: order.guestSessionId,
    restaurantId: order.restaurantId,
    deliveryAddressId: order.deliveryAddressId,
    deliveryAddress: order.deliveryAddress === null ? null : order.deliveryAddress,
    contactInfo: order.contactInfo === null ? null : order.contactInfo,
    notes: order.notes,
    idempotencyKey: order.idempotencyKey,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    paymentMethod: order.paymentMethod as PaymentMethod,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map(toOrderItem),
  };
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    const order = await this.db.order.create({
      data: {
        customerId: data.customerId || null,
        guestSessionId: data.guestSessionId || null,
        restaurantId: data.restaurantId,
        deliveryAddressId: data.deliveryAddressId || null,
        deliveryAddress:
          data.deliveryAddress === null ? Prisma.JsonNull : (data.deliveryAddress as Prisma.InputJsonValue),
        contactInfo:
          data.contactInfo === null || data.contactInfo === undefined
            ? Prisma.JsonNull
            : (data.contactInfo as Prisma.InputJsonValue),
        notes: data.notes,
        idempotencyKey: data.idempotencyKey || null,
        paymentMethod: (data.paymentMethod as any) || "cod",
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        totalAmount: data.totalAmount,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      select: {
        ...safeOrderSelect,
        items: {
          select: safeOrderItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return toOrder(order as unknown as OrderRow);
  }

  async findOrderById(id: string): Promise<Order | null> {
    const order = await this.db.order.findUnique({
      where: { id },
      select: {
        ...safeOrderSelect,
        items: {
          select: safeOrderItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return order ? toOrder(order as unknown as OrderRow) : null;
  }

  async findOrderByIdempotencyKey(key: string): Promise<Order | null> {
    if (!key) return null;
    const order = await this.db.order.findUnique({
      where: { idempotencyKey: key },
      select: {
        ...safeOrderSelect,
        items: {
          select: safeOrderItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return order ? toOrder(order as unknown as OrderRow) : null;
  }

  async listOrdersByCustomer(customerId: string, params: ListOrdersParams): Promise<ListOrdersResult> {
    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where: { customerId },
        select: {
          ...safeOrderSelect,
          items: {
            select: safeOrderItemSelect,
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
      this.db.order.count({
        where: { customerId },
      }),
    ]);

    return { orders: orders.map((o) => toOrder(o as unknown as OrderRow)), total };
  }

  async listOrdersByGuestSession(guestSessionId: string, params: ListOrdersParams): Promise<ListOrdersResult> {
    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where: { guestSessionId },
        select: {
          ...safeOrderSelect,
          items: {
            select: safeOrderItemSelect,
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
      this.db.order.count({
        where: { guestSessionId },
      }),
    ]);

    return { orders: orders.map((o) => toOrder(o as unknown as OrderRow)), total };
  }

  async listOrdersByRestaurant(restaurantId: string, params: ListOrdersParams): Promise<ListOrdersResult> {
    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where: { restaurantId },
        select: {
          ...safeOrderSelect,
          items: {
            select: safeOrderItemSelect,
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: params.offset,
        take: params.limit,
      }),
      this.db.order.count({
        where: { restaurantId },
      }),
    ]);

    return { orders: orders.map((o) => toOrder(o as unknown as OrderRow)), total };
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const existing = await this.db.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const order = await this.db.order.update({
      where: { id },
      data: { status },
      select: {
        ...safeOrderSelect,
        items: {
          select: safeOrderItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return toOrder(order as unknown as OrderRow);
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    const existing = await this.db.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const order = await this.db.order.update({
      where: { id },
      data: { paymentStatus },
      select: {
        ...safeOrderSelect,
        items: {
          select: safeOrderItemSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return toOrder(order as unknown as OrderRow);
  }
}
