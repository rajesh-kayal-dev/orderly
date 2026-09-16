import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreatePaymentData,
  PaymentRepository,
  UpdatePaymentStatusData,
} from "../../../domain/payment/payment.repository.js";
import type { Payment, PaymentMethod, PaymentStatus } from "../../../domain/payment/payment.types.js";

const safePaymentSelect = {
  id: true,
  orderId: true,
  customerId: true,
  amount: true,
  currency: true,
  method: true,
  status: true,
  provider: true,
  providerReference: true,
  providerPaymentId: true,
  failureReason: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

type PaymentRow = {
  id: string;
  orderId: string;
  customerId: string;
  amount: Prisma.Decimal;
  currency: string;
  method: string;
  status: string;
  provider: string | null;
  providerReference: string | null;
  providerPaymentId: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPayment(payment: PaymentRow): Payment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    customerId: payment.customerId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method as PaymentMethod,
    status: payment.status as PaymentStatus,
    provider: payment.provider,
    providerReference: payment.providerReference,
    providerPaymentId: payment.providerPaymentId,
    failureReason: payment.failureReason,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const payment = await this.db.payment.create({
      data: {
        orderId: data.orderId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: "pending",
        provider: data.provider,
        providerReference: data.providerReference,
      },
      select: safePaymentSelect,
    });

    return toPayment(payment as unknown as PaymentRow);
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    const payment = await this.db.payment.findUnique({
      where: { id },
      select: safePaymentSelect,
    });

    return payment ? toPayment(payment as unknown as PaymentRow) : null;
  }

  async findPaymentByOrder(orderId: string): Promise<Payment | null> {
    const payment = await this.db.payment.findFirst({
      where: { orderId },
      select: safePaymentSelect,
      orderBy: { createdAt: "desc" },
    });

    return payment ? toPayment(payment as unknown as PaymentRow) : null;
  }

  async updatePaymentStatus(id: string, data: UpdatePaymentStatusData): Promise<Payment | null> {
    const existing = await this.db.payment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const payment = await this.db.payment.update({
      where: { id },
      data: {
        status: data.status,
        providerPaymentId: data.providerPaymentId,
        failureReason: data.failureReason,
        paidAt: data.paidAt,
      },
      select: safePaymentSelect,
    });

    return toPayment(payment as unknown as PaymentRow);
  }
}