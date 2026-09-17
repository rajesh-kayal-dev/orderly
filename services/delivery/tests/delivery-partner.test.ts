import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { makeDeliveryPartner } from "./helpers/fake-delivery-partner.repository.js";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";

const PARTNER_BASE = "/delivery-partners";

describe("delivery partner API", () => {
  let api: HttpTestApi;

  before(async () => {
    api = await createHttpTestApi();
  });

  after(async () => {
    await api.close();
  });

  function data(res: { body: Record<string, unknown> | null }): Record<string, unknown> {
    return res.body?.data as Record<string, unknown>;
  }

  it("creates the own partner profile with provided vehicle information", async () => {
    const token = api.issueToken("partner-1");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
      body: {
        vehicleType: "Bike",
        vehicleNumber: "WB-12-3456",
      },
    });

    assert.equal(res.status, 201);
    assert.equal((res.body as { success: boolean }).success, true);
    assert.equal(data(res).userId, "partner-1");
    assert.equal(data(res).vehicleType, "Bike");
    assert.equal(data(res).vehicleNumber, "WB-12-3456");
  });

  it("is idempotent when the profile already exists", async () => {
    const token = api.issueToken("partner-1");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
      body: { vehicleType: "Car" },
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).userId, "partner-1");
    assert.equal(data(res).vehicleType, "Bike");
  });

  it("applies default vehicle type when none is provided", async () => {
    const token = api.issueToken("partner-default");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
    });

    assert.equal(res.status, 201);
    assert.equal(data(res).vehicleType, "Scooter / Bike");
  });

  it("returns the own profile", async () => {
    const token = api.issueToken("partner-get");

    await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
      body: { vehicleNumber: "KA-01-1111" },
    });

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "GET",
      token,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).userId, "partner-get");
    assert.equal(data(res).vehicleNumber, "KA-01-1111");
    assert.equal(data(res).isAvailable, false);
  });

  it("updates vehicle information", async () => {
    const token = api.issueToken("partner-update");

    await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
    });

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "PUT",
      token,
      body: {
        vehicleType: "Four Wheeler",
        vehicleNumber: "DL-09-8765",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).vehicleType, "Four Wheeler");
    assert.equal(data(res).vehicleNumber, "DL-09-8765");
  });

  it("clears vehicle information when set to null", async () => {
    const token = api.issueToken("partner-clear");

    await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
      body: { vehicleNumber: "MH-02-9999" },
    });

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "PUT",
      token,
      body: { vehicleNumber: null },
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).vehicleNumber, null);
  });

  it("returns 404 when updating a nonexistent profile", async () => {
    const token = api.issueToken("partner-missing");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "PUT",
      token,
      body: { vehicleType: "Bike" },
    });

    assert.equal(res.status, 404);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("toggles availability", async () => {
    const token = api.issueToken("partner-avail");

    await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
    });

    const on = await request(api.baseUrl, `${PARTNER_BASE}/me/availability`, {
      method: "PUT",
      token,
      body: { isAvailable: true },
    });

    assert.equal(on.status, 200);
    assert.equal(data(on).isAvailable, true);

    const off = await request(api.baseUrl, `${PARTNER_BASE}/me/availability`, {
      method: "PUT",
      token,
      body: { isAvailable: false },
    });

    assert.equal(off.status, 200);
    assert.equal(data(off).isAvailable, false);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "GET",
    });

    assert.equal(res.status, 401);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("rejects a non-delivery-partner role", async () => {
    const token = api.issueToken("customer-1", "CUSTOMER");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "GET",
      token,
    });

    assert.equal(res.status, 403);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 400 for invalid request bodies", async () => {
    const token = api.issueToken("partner-invalid");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "POST",
      token,
      body: { vehicleType: 42 },
    });

    assert.equal(res.status, 400);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 400 for invalid availability payloads", async () => {
    const token = api.issueToken("partner-invalid-avail");

    const res = await request(api.baseUrl, `${PARTNER_BASE}/me/availability`, {
      method: "PUT",
      token,
      body: { isAvailable: "yes" },
    });

    assert.equal(res.status, 400);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("looks up the profile by the JWT sub, not by any client-provided identity", async () => {
    const tokenA = api.issueToken("partner-a");
    const tokenB = api.issueToken("partner-b");

    await api.handle.seedProfile(makeDeliveryPartner("partner-b"));

    const resA = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "GET",
      token: tokenA,
    });

    const resB = await request(api.baseUrl, `${PARTNER_BASE}/me`, {
      method: "GET",
      token: tokenB,
    });

    assert.equal(resA.status, 200);
    assert.equal(data(resA).userId, "partner-a");
    assert.equal(data(resB).userId, "partner-b");
    assert.notEqual(data(resA).id, data(resB).id);
  });
});