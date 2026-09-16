import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { makeUser } from "./helpers/fake-user-repository.js";
import {
  createHttpTestApi,
  request,
  type ApiResponse,
  type HttpTestApi,
} from "./helpers/http-api.js";

const ADMIN_USER = makeUser("admin-user", {
  email: "admin@example.com",
  role: "ADMIN",
  status: "ACTIVE",
});

const CUSTOMER_USER = makeUser("customer-user", {
  email: "customer@example.com",
  status: "ACTIVE",
});

const ACTIVE_RESTAURANT = makeUser("restaurant-user", {
  email: "restaurant@example.com",
  role: "RESTAURANT",
  status: "ACTIVE",
});

const PENDING_CUSTOMER = makeUser("pending-customer", {
  email: "pending-customer@example.com",
  status: "PENDING_APPROVAL",
});

const PENDING_RESTAURANT = makeUser("pending-restaurant", {
  email: "pending-restaurant@example.com",
  role: "RESTAURANT",
  status: "PENDING_APPROVAL",
});

const PENDING_DELIVERY = makeUser("pending-delivery", {
  email: "pending-delivery@example.com",
  role: "DELIVERY_PARTNER",
  status: "PENDING_APPROVAL",
});

function dataOf(res: ApiResponse): Record<string, unknown> {
  const value = res.body?.data;
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}

function listOf(res: ApiResponse): Array<Record<string, unknown>> {
  const value = res.body?.data;
  assert.ok(Array.isArray(value));
  return value as Array<Record<string, unknown>>;
}

describe("admin HTTP API", () => {
  let api: HttpTestApi;
  let adminToken: string;
  let customerToken: string;

  before(async () => {
    api = await createHttpTestApi([
      ADMIN_USER,
      CUSTOMER_USER,
      ACTIVE_RESTAURANT,
      PENDING_CUSTOMER,
      PENDING_RESTAURANT,
      PENDING_DELIVERY,
    ]);
    adminToken = api.jwt.issueAccessToken("admin-user", "ADMIN");
    customerToken = api.jwt.issueAccessToken("customer-user", "CUSTOMER");
  });

  after(async () => {
    await api.close();
  });

  test("admin endpoints require a bearer token", async () => {
    const res = await request(api.baseUrl, "/admin/users");

    assert.equal(res.status, 401);
  });

  test("admin endpoints reject a non-admin user", async () => {
    const res = await request(api.baseUrl, "/admin/users", { token: customerToken });

    assert.equal(res.status, 403);
    assert.equal(res.body?.message, "Not authorized for this action");
  });

  test("GET /admin/users lists users for an admin without leaking secrets", async () => {
    const res = await request(api.baseUrl, "/admin/users", { token: adminToken });

    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);

    const data = dataOf(res);
    assert.equal(data.total, 6);

    const users = data.users as Array<Record<string, unknown>>;
    assert.equal(users.length, 6);
    assert.ok(users.every((user) => typeof user.email === "string"));
  });

  test("GET /admin/users can filter by status", async () => {
    const res = await request(api.baseUrl, "/admin/users?status=SUSPENDED", { token: adminToken });

    assert.equal(res.status, 200);

    const data = dataOf(res);
    assert.equal(data.total, 0);
  });

  test("GET /admin/users can paginate with limit", async () => {
    const res = await request(api.baseUrl, "/admin/users?limit=2", { token: adminToken });

    assert.equal(res.status, 200);

    const data = dataOf(res);
    assert.equal(data.total, 6);
    assert.equal((data.users as unknown[]).length, 2);
  });

  test("an invalid status query is rejected with 400", async () => {
    const res = await request(api.baseUrl, "/admin/users?status=ROGUE", { token: adminToken });

    assert.equal(res.status, 400);
  });

  test("PUT /admin/users/:id/status suspends a user", async () => {
    const res = await request(api.baseUrl, "/admin/users/customer-user/status", {
      method: "PUT",
      token: adminToken,
      body: { status: "SUSPENDED" },
    });

    assert.equal(res.status, 200);

    const user = dataOf(res);
    assert.equal(user.id, "customer-user");
    assert.equal(user.status, "SUSPENDED");
    assert.equal(user.statusChangedBy, "admin-user");
  });

  test("a suspended user is blocked from protected APIs", async () => {
    const res = await request(api.baseUrl, "/auth/me", { token: customerToken });

    assert.equal(res.status, 403);
  });

  test("an admin cannot change their own status", async () => {
    const res = await request(api.baseUrl, "/admin/users/admin-user/status", {
      method: "PUT",
      token: adminToken,
      body: { status: "SUSPENDED" },
    });

    assert.equal(res.status, 409);
    assert.equal(res.body?.message, "Administrators cannot change their own account status");
  });

  test("an invalid status value is rejected with 400", async () => {
    const res = await request(api.baseUrl, "/admin/users/restaurant-user/status", {
      method: "PUT",
      token: adminToken,
      body: { status: "BANNED" },
    });

    assert.equal(res.status, 400);
  });

  test("unknown users get 404", async () => {
    const res = await request(api.baseUrl, "/admin/users/ghost-user/status", {
      method: "PUT",
      token: adminToken,
      body: { status: "SUSPENDED" },
    });

    assert.equal(res.status, 404);
  });

  test("GET /admin/approvals lists only pending approval-required roles", async () => {
    const res = await request(api.baseUrl, "/admin/approvals", { token: adminToken });

    assert.equal(res.status, 200);

    const approvals = listOf(res);
    assert.equal(approvals.length, 2);

    const ids = approvals.map((user) => user.id).sort();
    assert.deepEqual(ids, ["pending-delivery", "pending-restaurant"]);
  });

  test("approve transitions a pending delivery partner to active", async () => {
    const res = await request(api.baseUrl, "/admin/approvals/pending-delivery/approve", {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 200);

    const user = dataOf(res);
    assert.equal(user.id, "pending-delivery");
    assert.equal(user.status, "ACTIVE");
    assert.equal(user.statusChangedBy, "admin-user");
  });

  test("approval is rejected for an account that is not pending", async () => {
    const res = await request(api.baseUrl, "/admin/approvals/pending-delivery/approve", {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 409);
  });

  test("non-admins cannot approve accounts", async () => {
    const res = await request(api.baseUrl, "/admin/approvals/pending-restaurant/approve", {
      method: "POST",
      token: customerToken,
    });

    assert.equal(res.status, 403);
  });

  test("a pending customer is not part of the approval queue", async () => {
    const res = await request(api.baseUrl, "/admin/approvals/pending-customer/approve", {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 409);
  });

  test("rejection is not supported and returns 501", async () => {
    const res = await request(api.baseUrl, "/admin/approvals/pending-restaurant/reject", {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 501);
  });

  test("approvals list is empty after all pending accounts are resolved", async () => {
    await request(api.baseUrl, "/admin/approvals/pending-restaurant/approve", {
      method: "POST",
      token: adminToken,
    });

    const res = await request(api.baseUrl, "/admin/approvals", { token: adminToken });

    assert.equal(res.status, 200);
    assert.equal(listOf(res).length, 0);
  });
});