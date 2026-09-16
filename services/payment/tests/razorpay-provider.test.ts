import { describe, it } from "node:test";
import assert from "node:assert";
import { createHmac } from "node:crypto";
import { RazorpayPaymentProvider } from "../src/infrastructure/payment/razorpay.provider.js";

function signature(reference: string, paymentId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${reference}|${paymentId}`).digest("hex");
}

describe("RazorpayPaymentProvider.verifyPayment", () => {
  it("returns valid when the HMAC signature matches", async () => {
    const provider = new RazorpayPaymentProvider("rzp_test_key", "secret_123");

    const result = await provider.verifyPayment({
      providerReference: "order_103",
      providerPaymentId: "pay_29QQoUBi66xm2f",
      providerPaymentSignature: signature("order_103", "pay_29QQoUBi66xm2f", "secret_123"),
    });

    assert.deepStrictEqual(result, { valid: true });
  });

  it("returns invalid when the signature does not match", async () => {
    const provider = new RazorpayPaymentProvider("rzp_test_key", "secret_123");

    const result = await provider.verifyPayment({
      providerReference: "order_103",
      providerPaymentId: "pay_29QQoUBi66xm2f",
      providerPaymentSignature: "forged_signature",
    });

    assert.deepStrictEqual(result, { valid: false });
  });

  it("returns invalid when the wrong key secret is used", async () => {
    const provider = new RazorpayPaymentProvider("rzp_test_key", "secret_123");

    const result = await provider.verifyPayment({
      providerReference: "order_103",
      providerPaymentId: "pay_29QQoUBi66xm2f",
      providerPaymentSignature: signature("order_103", "pay_29QQoUBi66xm2f", "wrong_secret"),
    });

    assert.deepStrictEqual(result, { valid: false });
  });
});