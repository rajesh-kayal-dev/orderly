import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import bcrypt from "bcryptjs";
import { makeUser } from "./helpers/fake-user-repository.js";
import {
  createHttpTestApi,
  request,
  type ApiResponse,
  type HttpTestApi,
} from "./helpers/http-api.js";

const PASSWORD = "correct-password";
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

const ACTIVE_USER = makeUser("active-user", {
  email: "active@example.com",
  role: "CUSTOMER",
  status: "ACTIVE",
  passwordHash,
});

const SUSPENDED_USER = makeUser("suspended-user", {
  email: "suspended@example.com",
  status: "SUSPENDED",
  passwordHash,
});

const PENDING_USER = makeUser("pending-user", {
  email: "pending@example.com",
  status: "PENDING_APPROVAL",
  passwordHash,
});

function dataOf(res: ApiResponse): Record<string, unknown> {
  const value = res.body?.data;
  assert.ok(value !== null && typeof value === "object");
  return value as Record<string, unknown>;
}

describe("auth HTTP API", () => {
  let api: HttpTestApi;

  before(async () => {
    api = await createHttpTestApi([ACTIVE_USER, SUSPENDED_USER, PENDING_USER]);
  });

  after(async () => {
    await api.close();
  });

  test("register returns 201 and never exposes the password hash", async () => {
    const res = await request(api.baseUrl, "/auth/register", {
      method: "POST",
      body: { email: "new@example.com", password: "strong-password-1", fullName: "New User" },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body?.success, true);
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);

    const user = dataOf(res);
    assert.equal(user.email, "new@example.com");
    assert.equal(user.fullName, "New User");
    assert.equal(user.status, "ACTIVE");
  });

  test("register rejects a duplicate email with 409", async () => {
    const res = await request(api.baseUrl, "/auth/register", {
      method: "POST",
      body: { email: "active@example.com", password: "strong-password-1", fullName: "Dup" },
    });

    assert.equal(res.status, 409);
    assert.equal(res.body?.message, "Email is already registered");
  });

  test("register rejects an invalid payload with 400", async () => {
    const res = await request(api.baseUrl, "/auth/register", {
      method: "POST",
      body: { email: "not-an-email", password: "short", fullName: "" },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body?.message, "Validation failed");
  });

  test("login returns an access token and user without the password hash", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "active@example.com", password: PASSWORD },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);

    const data = dataOf(res);
    assert.equal(typeof data.accessToken, "string");
    assert.ok((data.accessToken as string).length > 0);

    const user = data.user as Record<string, unknown>;
    assert.equal(user.email, "active@example.com");
  });

  test("login rejects a wrong password with 401", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "active@example.com", password: "wrong-password" },
    });

    assert.equal(res.status, 401);
    assert.equal(res.body?.message, "Invalid email or password");
  });

  test("login rejects an unknown email with 401", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "ghost@example.com", password: PASSWORD },
    });

    assert.equal(res.status, 401);
  });

  test("login rejects an invalid payload with 400", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "not-an-email", password: "" },
    });

    assert.equal(res.status, 400);
  });

  test("login rejects a suspended account with 403", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "suspended@example.com", password: PASSWORD },
    });

    assert.equal(res.status, 403);
    assert.equal(res.body?.message, "Account is suspended");
  });

  test("login rejects a pending-approval account with 403", async () => {
    const res = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "pending@example.com", password: PASSWORD },
    });

    assert.equal(res.status, 403);
    assert.equal(res.body?.message, "Account is pending admin approval");
  });

  test("GET /auth/me returns the current user with a valid token", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", { token });

    assert.equal(res.status, 200);
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);

    const user = dataOf(res);
    assert.equal(user.id, "active-user");
    assert.equal(user.email, "active@example.com");
  });

  test("GET /auth/me requires a bearer token", async () => {
    const res = await request(api.baseUrl, "/auth/me");

    assert.equal(res.status, 401);
    assert.equal(res.body?.message, "Authentication required");
  });

  test("GET /auth/me rejects an invalid token with 401", async () => {
    const res = await request(api.baseUrl, "/auth/me", { token: "not-a-jwt" });

    assert.equal(res.status, 401);
    assert.equal(res.body?.message, "Invalid or expired token");
  });

  test("GET /auth/me rejects a token for a user that no longer exists", async () => {
    const token = api.jwt.issueAccessToken("ghost-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", { token });

    assert.equal(res.status, 401);
    assert.equal(res.body?.message, "User not found");
  });

  test("GET /auth/me rejects a suspended user with 403", async () => {
    const token = api.jwt.issueAccessToken("suspended-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", { token });

    assert.equal(res.status, 403);
  });

  test("GET /auth/me rejects a pending-approval user with 403", async () => {
    const token = api.jwt.issueAccessToken("pending-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", { token });

    assert.equal(res.status, 403);
  });

  test("PUT /auth/me updates the profile of the current user", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", {
      method: "PUT",
      token,
      body: { fullName: "Updated Name", phoneNumber: "555-0100" },
    });

    assert.equal(res.status, 200);
    assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);

    const user = dataOf(res);
    assert.equal(user.fullName, "Updated Name");
    assert.equal(user.phoneNumber, "555-0100");
  });

  test("PUT /auth/me requires a bearer token", async () => {
    const res = await request(api.baseUrl, "/auth/me", {
      method: "PUT",
      body: { fullName: "Updated Name" },
    });

    assert.equal(res.status, 401);
  });

  test("PUT /auth/me ignores attempts to escalate the role", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", {
      method: "PUT",
      token,
      body: { fullName: "Still A Customer", role: "ADMIN" },
    });

    assert.equal(res.status, 200);

    const user = dataOf(res);
    assert.equal(user.role, "CUSTOMER");
  });

  test("PUT /auth/me rejects a role-only payload with 400", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/me", {
      method: "PUT",
      token,
      body: { role: "ADMIN" },
    });

    assert.equal(res.status, 400);
  });

  test("POST /auth/change-password requires the current password", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/change-password", {
      method: "POST",
      token,
      body: { currentPassword: "wrong-password", newPassword: "a-new-password" },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body?.message, "Current password is incorrect");
  });

  test("POST /auth/change-password validates the new password", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/change-password", {
      method: "POST",
      token,
      body: { currentPassword: PASSWORD, newPassword: "short" },
    });

    assert.equal(res.status, 400);
  });

  test("POST /auth/change-password requires a bearer token", async () => {
    const res = await request(api.baseUrl, "/auth/change-password", {
      method: "POST",
      body: { currentPassword: PASSWORD, newPassword: "a-new-password" },
    });

    assert.equal(res.status, 401);
  });

  test("POST /auth/change-password rotates the password", async () => {
    const token = api.jwt.issueAccessToken("active-user", "CUSTOMER");
    const res = await request(api.baseUrl, "/auth/change-password", {
      method: "POST",
      token,
      body: { currentPassword: PASSWORD, newPassword: "a-new-password" },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);

    const oldLogin = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "active@example.com", password: PASSWORD },
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request(api.baseUrl, "/auth/login", {
      method: "POST",
      body: { email: "active@example.com", password: "a-new-password" },
    });
    assert.equal(newLogin.status, 200);
  });
});