import { describe, it } from "node:test";
import assert from "node:assert";
import { canTransitionPaymentStatus } from "../src/domain/payment/payment.types.js";

describe("canTransitionPaymentStatus", () => {
  it("allows pending -> paid", () => {
    assert.strictEqual(canTransitionPaymentStatus("pending", "paid"), true);
  });

  it("allows pending -> failed", () => {
    assert.strictEqual(canTransitionPaymentStatus("pending", "failed"), true);
  });

  it("allows pending -> cancelled", () => {
    assert.strictEqual(canTransitionPaymentStatus("pending", "cancelled"), true);
  });

  it("allows paid -> refunded", () => {
    assert.strictEqual(canTransitionPaymentStatus("paid", "refunded"), true);
  });

  it("rejects skipping from terminal statuses", () => {
    assert.strictEqual(canTransitionPaymentStatus("failed", "pending"), false);
    assert.strictEqual(canTransitionPaymentStatus("failed", "paid"), false);
    assert.strictEqual(canTransitionPaymentStatus("cancelled", "paid"), false);
    assert.strictEqual(canTransitionPaymentStatus("refunded", "paid"), false);
  });

  it("rejects impossible transitions", () => {
    assert.strictEqual(canTransitionPaymentStatus("pending", "refunded"), false);
    assert.strictEqual(canTransitionPaymentStatus("paid", "failed"), false);
    assert.strictEqual(canTransitionPaymentStatus("paid", "cancelled"), false);
  });

  it("rejects transitioning to the same status", () => {
    assert.strictEqual(canTransitionPaymentStatus("pending", "pending"), false);
    assert.strictEqual(canTransitionPaymentStatus("paid", "paid"), false);
  });
});