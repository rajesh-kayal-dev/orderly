import { describe, it } from "node:test";
import assert from "node:assert";
import {
  canTransitionOrderStatus,
  isCancellableStatus,
} from "../src/domain/order/order.types.js";

describe("canTransitionOrderStatus", () => {
  it("allows placed -> accepted", () => {
    assert.strictEqual(canTransitionOrderStatus("placed", "accepted"), true);
  });

  it("allows accepted -> preparing", () => {
    assert.strictEqual(canTransitionOrderStatus("accepted", "preparing"), true);
  });

  it("allows preparing -> ready", () => {
    assert.strictEqual(canTransitionOrderStatus("preparing", "ready"), true);
  });

  it("allows cancellation from placed, accepted, preparing, and ready", () => {
    assert.strictEqual(canTransitionOrderStatus("placed", "cancelled"), true);
    assert.strictEqual(canTransitionOrderStatus("accepted", "cancelled"), true);
    assert.strictEqual(canTransitionOrderStatus("preparing", "cancelled"), true);
    assert.strictEqual(canTransitionOrderStatus("ready", "cancelled"), true);
  });

  it("rejects skipping steps", () => {
    assert.strictEqual(canTransitionOrderStatus("placed", "preparing"), false);
    assert.strictEqual(canTransitionOrderStatus("placed", "ready"), false);
    assert.strictEqual(canTransitionOrderStatus("accepted", "ready"), false);
  });

  it("rejects moving backwards from a terminal status", () => {
    assert.strictEqual(canTransitionOrderStatus("cancelled", "placed"), false);
    assert.strictEqual(canTransitionOrderStatus("cancelled", "accepted"), false);
    assert.strictEqual(canTransitionOrderStatus("ready", "preparing"), false);
  });

  it("rejects unknown transitions from every status", () => {
    assert.strictEqual(canTransitionOrderStatus("delivered", "completed"), false);
    assert.strictEqual(canTransitionOrderStatus("assigned", "picked_up"), false);
    assert.strictEqual(canTransitionOrderStatus("picked_up", "delivered"), false);
  });
});

describe("isCancellableStatus", () => {
  it("returns true only for placed and accepted", () => {
    assert.strictEqual(isCancellableStatus("placed"), true);
    assert.strictEqual(isCancellableStatus("accepted"), true);
    assert.strictEqual(isCancellableStatus("preparing"), false);
    assert.strictEqual(isCancellableStatus("ready"), false);
    assert.strictEqual(isCancellableStatus("cancelled"), false);
  });
});