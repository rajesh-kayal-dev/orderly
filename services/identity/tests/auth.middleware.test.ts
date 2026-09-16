import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../src/interfaces/http/middleware/auth.middleware.js";
import type { User } from "../src/domain/user/user.types.js";
import { makeUser } from "./helpers/fake-user-repository.js";

interface MockResponse {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponse;
  json(body: unknown): MockResponse;
  nextCalled?: boolean;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 0,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as Request;
}

function createDeps(user: User | null, verify = () => ({ sub: "u1", role: "ADMIN" })) {
  const findUserById = async () => user;
  return { verifyAccessToken: verify, findUserById };
}

async function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void | Promise<void>,
  req: Request,
): Promise<MockResponse> {
  const res = createMockResponse();
  let nextCalled = false;

  const result = middleware(req, res, () => { nextCalled = true; });

  if (result instanceof Promise) {
    await result;
  }

  return { ...res, nextCalled } as MockResponse;
}

test("requireAuth without a Bearer token returns 401", async () => {
  const req = createRequest();
  const res = (await runMiddleware(requireAuth(createDeps(null)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.statusCode, 401);
  assert.equal(res.nextCalled, false);
});

test("requireAuth with a non-Bearer header returns 401", async () => {
  const req = createRequest({ headers: { authorization: "Basic abc" } });
  const res = (await runMiddleware(requireAuth(createDeps(null)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.statusCode, 401);
  assert.equal(res.nextCalled, false);
});

test("requireAuth rejects an invalid token", async () => {
  const req = createRequest({ headers: { authorization: "Bearer bad-token" } });
  const res = (await runMiddleware(
    requireAuth({ verifyAccessToken: () => { throw new Error("invalid"); }, findUserById: async () => null }),
    req,
  )) as unknown as MockResponse & { nextCalled?: boolean };

  assert.equal(res.statusCode, 401);
});

test("requireAuth returns 401 when the user no longer exists", async () => {
  const req = createRequest({ headers: { authorization: "Bearer token" } });
  const res = (await runMiddleware(requireAuth(createDeps(null)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.statusCode, 401);
});

test("requireAuth returns 403 for a suspended user with a valid token", async () => {
  const user: User = makeUser("u1", { status: "SUSPENDED" }).user;
  const req = createRequest({ headers: { authorization: "Bearer token" } });
  const res = (await runMiddleware(requireAuth(createDeps(user)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.statusCode, 403);
  assert.equal(res.nextCalled, false);
});

test("requireAuth returns 403 for a pending-approval user with a valid token", async () => {
  const user: User = makeUser("u1", { role: "RESTAURANT", status: "PENDING_APPROVAL" }).user;
  const req = createRequest({ headers: { authorization: "Bearer token" } });
  const res = (await runMiddleware(requireAuth(createDeps(user)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.statusCode, 403);
  assert.equal(res.nextCalled, false);
});

test("requireAuth attaches the user for an active account", async () => {
  const user: User = makeUser("u1").user;
  const req = createRequest({ headers: { authorization: "Bearer token" } });
  const res = (await runMiddleware(requireAuth(createDeps(user)), req)) as unknown as MockResponse & {
    nextCalled?: boolean;
  };

  assert.equal(res.nextCalled, true);
  assert.equal((req as AuthenticatedRequest).user?.id, "u1");
});

test("requireRole allows matching roles and rejects mismatches", () => {
  const req = createRequest() as AuthenticatedRequest;
  req.user = makeUser("u1", { role: "ADMIN" }).user;
  const res = createMockResponse() as unknown as Response;
  let passed = false;

  requireRole("ADMIN")(req, res, () => { passed = true; });
  assert.equal(passed, true);

  passed = false;
  requireRole("CUSTOMER_SUPPORT")(req, res, () => { passed = true; });
  assert.equal(passed, false);
  assert.equal((res as unknown as MockResponse).statusCode, 403);
});

test("requireRole rejects requests without an authenticated user", () => {
  const req = createRequest();
  const res = createMockResponse() as unknown as Response;
  let passed = false;

  requireRole("ADMIN")(req, res, () => { passed = true; });
  assert.equal(passed, false);
  assert.equal((res as unknown as MockResponse).statusCode, 403);
});