import { Decimal } from "decimal.js";
import type { OrderClient, OrderTotal } from "../../domain/order/order.client.js";

interface OrderServiceResponse {
  success: boolean;
  data?: {
    id: string;
    totalAmount: string | number;
    paymentStatus: string;
    customerId: string;
  };
}

export class HttpOrderClient implements OrderClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 5000,
  ) {}

  async getOrderTotal(orderId: string, authToken: string): Promise<OrderTotal | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl}/orders/${encodeURIComponent(orderId)}`,
        {
          headers: { authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        return null;
      }

      const body = (await response.json()) as OrderServiceResponse;

      if (!response.ok || !body.success || !body.data) {
        throw new Error(`Order service request failed with status ${response.status}`);
      }

      return {
        id: body.data.id,
        totalAmount: new Decimal(body.data.totalAmount),
        paymentStatus: body.data.paymentStatus,
        customerId: body.data.customerId,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
