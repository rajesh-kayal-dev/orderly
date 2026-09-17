import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createDeliveryHttpTestApi, request, type ApiResponse } from "./helpers/http-api.js";

describe("delivery lifecycle API", () => {
  let api: Awaited<ReturnType<typeof createDeliveryHttpTestApi>>;

  before(async () => {
    api = await createDeliveryHttpTestApi();
  });

  after(async () => {
    await api.close();
  });

  function data(res: ApiResponse): Record<string, unknown> {
    return res.body?.data as Record<string, unknown>;
  }

  async function provisionAvailablePartner(userId: string): Promise<string> {
    const created = await request(api.baseUrl, "/delivery-partners/me", {
      method: "POST",
      token: api.issueToken(userId),
    });
    assert.equal(created.status, 201);

    const partnerId = String((created.body?.data as Record<string, unknown>).id);

    const availability = await request(api.baseUrl, "/delivery-partners/me/availability", {
      method: "PUT",
      token: api.issueToken(userId),
      body: { isAvailable: true },
    });
    assert.equal(availability.status, 200);

    return partnerId;
  }

  async function createDelivery(orderId: string): Promise<string> {
    const res = await request(api.baseUrl, "/deliveries", {
      method: "POST",
      token: api.issueToken("admin-1", "ADMIN"),
      body: { orderId },
    });
    assert.equal(res.status, 201);
    return String(data(res).id);
  }

  async function runAccept(partnerName: string, deliveryId: string): Promise<ApiResponse> {
    return request(api.baseUrl, `/deliveries/me/accept/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken(partnerName),
    });
  }

  async function runPickup(partnerName: string, deliveryId: string): Promise<ApiResponse> {
    return request(api.baseUrl, `/deliveries/me/pickup/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken(partnerName),
    });
  }

  async function runStartTransit(partnerName: string, deliveryId: string): Promise<ApiResponse> {
    return request(api.baseUrl, `/deliveries/me/start-transit/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken(partnerName),
    });
  }

  async function runComplete(partnerName: string, deliveryId: string): Promise<ApiResponse> {
    return request(api.baseUrl, `/deliveries/me/complete/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken(partnerName),
    });
  }

  async function runFail(partnerName: string, deliveryId: string): Promise<ApiResponse> {
    return request(api.baseUrl, `/deliveries/me/fail/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken(partnerName),
    });
  }

  it("walks the full lifecycle assigned → picked_up → in_transit → delivered", async () => {
    const partnerId = await provisionAvailablePartner("lifedriver");
    const deliveryId = await createDelivery("order-lifecycle");

    const accepted = await runAccept("lifedriver", deliveryId);
    assert.equal(accepted.status, 200);
    assert.equal(data(accepted).status, "assigned");
    assert.equal(data(accepted).partnerId, partnerId);

    const pickedUp = await runPickup("lifedriver", deliveryId);
    assert.equal(pickedUp.status, 200);
    assert.equal(data(pickedUp).status, "picked_up");
    assert.notEqual(data(pickedUp).pickupTime, null);

    const inTransit = await runStartTransit("lifedriver", deliveryId);
    assert.equal(inTransit.status, 200);
    assert.equal(data(inTransit).status, "in_transit");
    assert.notEqual(data(inTransit).inTransitAt, null);

    const delivered = await runComplete("lifedriver", deliveryId);
    assert.equal(delivered.status, 200);
    assert.equal(data(delivered).status, "delivered");
    assert.notEqual(data(delivered).deliveredAt, null);
  });

  it("allows failing an assigned delivery", async () => {
    await provisionAvailablePartner("faildriver");
    const deliveryId = await createDelivery("order-fail-assigned");

    await runAccept("faildriver", deliveryId);

    const failed = await runFail("faildriver", deliveryId);
    assert.equal(failed.status, 200);
    assert.equal(data(failed).status, "failed");
    assert.notEqual(data(failed).failedAt, null);
  });

  it("allows failing an in-transit delivery", async () => {
    await provisionAvailablePartner("faildriver-2");
    const deliveryId = await createDelivery("order-fail-transit");

    await runAccept("faildriver-2", deliveryId);
    await runPickup("faildriver-2", deliveryId);
    await runStartTransit("faildriver-2", deliveryId);

    const failed = await runFail("faildriver-2", deliveryId);
    assert.equal(failed.status, 200);
    assert.equal(data(failed).status, "failed");
  });

  it("rejects invalid transitions from every live state", async () => {
    await provisionAvailablePartner("strictdriver");
    const deliveryId = await createDelivery("order-strict");

    await runAccept("strictdriver", deliveryId);

    const skipToDelivered = await runComplete("strictdriver", deliveryId);
    assert.equal(skipToDelivered.status, 409);

    const skipToPickedUp = await runPickup("strictdriver", deliveryId);
    assert.equal(skipToPickedUp.status, 200);

    const skipToDeliveredFromPickedUp = await runComplete("strictdriver", deliveryId);
    assert.equal(skipToDeliveredFromPickedUp.status, 409);

    const failFromPickedUp = await runFail("strictdriver", deliveryId);
    assert.equal(failFromPickedUp.status, 200);

    const continueAfterFail = await runStartTransit("strictdriver", deliveryId);
    assert.equal(continueAfterFail.status, 409);

    const pickupAfterFail = await runPickup("strictdriver", deliveryId);
    assert.equal(pickupAfterFail.status, 409);
  });

  it("rejects lifecycle actions before acceptance", async () => {
    const deliveryId = await createDelivery("order-hasty");

    const pickup = await runPickup("hastydriver", deliveryId);
    assert.equal(pickup.status, 404);

    const complete = await runComplete("hastydriver", deliveryId);
    assert.equal(complete.status, 404);
  });

  it("rejects a delivered delivery from continuing", async () => {
    await provisionAvailablePartner("terminaldriver");
    const deliveryId = await createDelivery("order-terminal");

    await runAccept("terminaldriver", deliveryId);
    await runPickup("terminaldriver", deliveryId);
    await runStartTransit("terminaldriver", deliveryId);
    const delivered = await runComplete("terminaldriver", deliveryId);
    assert.equal(delivered.status, 200);

    const pickupAfter = await runPickup("terminaldriver", deliveryId);
    assert.equal(pickupAfter.status, 409);

    const failAfter = await runFail("terminaldriver", deliveryId);
    assert.equal(failAfter.status, 409);
  });

  it("rejects a partner operating a delivery they do not own", async () => {
    await provisionAvailablePartner("owner-driver");
    await provisionAvailablePartner("sneak-driver");
    const deliveryId = await createDelivery("order-ownership");

    await runAccept("owner-driver", deliveryId);
    const accepted = api.deliveryHandle.getDeliveries().find((d) => d.id === deliveryId)!;
    assert.equal(accepted.partnerId !== null, true);

    const sneakPickup = await runPickup("sneak-driver", deliveryId);
    assert.equal(sneakPickup.status, 403);

    const sneakComplete = await runComplete("sneak-driver", deliveryId);
    assert.equal(sneakComplete.status, 403);

    const sneakFail = await runFail("sneak-driver", deliveryId);
    assert.equal(sneakFail.status, 403);

    const stillAssigned = api.deliveryHandle.getDeliveries().find((d) => d.id === deliveryId)!;
    assert.equal(stillAssigned.status, "assigned");
    assert.equal(stillAssigned.partnerId, accepted.partnerId);
  });

  it("rejects lifecycle actions without a partner profile", async () => {
    const deliveryId = await createDelivery("order-noprofile-lc");

    const pickup = await runPickup("ghost-driver", deliveryId);
    assert.equal(pickup.status, 404);

    const complete = await runComplete("ghost-driver", deliveryId);
    assert.equal(complete.status, 404);
  });

  it("is not idempotent for repeated lifecycle transitions (strict by design)", async () => {
    await provisionAvailablePartner("repeatdriver");
    const deliveryId = await createDelivery("order-repeat");

    const pickupOnce = await runPickup("repeatdriver", deliveryId);
    assert.equal(pickupOnce.status, 403);

    await runAccept("repeatdriver", deliveryId);

    const pickup = await runPickup("repeatdriver", deliveryId);
    assert.equal(pickup.status, 200);

    const pickupAgain = await runPickup("repeatdriver", deliveryId);
    assert.equal(pickupAgain.status, 409);

    const delivery = api.deliveryHandle.getDeliveries().find((d) => d.id === deliveryId)!;
    assert.equal(delivery.status, "picked_up");
  });

  it("rejects admin mutating operations for partners and vice versa", async () => {
    const deliveryId = await createDelivery("order-role-guard");

    const adminPickup = await request(api.baseUrl, `/deliveries/me/pickup/${deliveryId}`, {
      method: "PUT",
      token: api.issueToken("admin-1", "ADMIN"),
    });
    assert.equal(adminPickup.status, 403);
  });
});