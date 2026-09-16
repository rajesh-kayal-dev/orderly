import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { Payment } from "../../domain/payment/payment.types.js";
import { PaymentForbiddenError, PaymentNotFoundError } from "./errors.js";

export const getPayment =
  (payments: PaymentRepository) =>
  async (customerId: string, paymentId: string): Promise<Payment> => {
    const payment = await payments.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.customerId !== customerId) {
      throw new PaymentForbiddenError();
    }

    return payment;
  };