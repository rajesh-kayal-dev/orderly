import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  InvalidCredentialsError,
  loginUser,
  PendingApprovalAccountError,
  SuspendedAccountError,
} from "../src/application/auth/login-user.js";
import { loginUserSchema } from "../src/interfaces/http/auth.schemas.js";
import type { UserRepository } from "../src/domain/user/user.repository.js";
import type { User, UserCredentials } from "../src/domain/user/user.types.js";

const passwordHash = bcrypt.hashSync("correct-password", 4);

function createCredentials(overrides: Partial<UserCredentials> = {}): UserCredentials {
  return {
    id: "user-1",
    email: "user@example.com",
    fullName: "Test User",
    phoneNumber: null,
    role: "CUSTOMER",
    status: "ACTIVE",
    passwordHash,
    ...overrides,
  };
}

function createRepository(credentials: UserCredentials | null) {
  const lookupEmails: string[] = [];

  const repo: UserRepository = {
    async findByEmail(email) {
      if (!credentials || email !== credentials.email) {
        return null;
      }
      const user: User = {
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
        statusChangedAt: null,
        statusChangedBy: null,
      };
      return user;
    },
    async findById() {
      return null;
    },
    async findCredentialsByEmail(email) {
      lookupEmails.push(email);
      if (!credentials || email !== credentials.email) {
        return null;
      }
      return credentials;
    },
    async findCredentialsById() {
      return null;
    },
    async create() {
      throw new Error("create is not used in login tests");
    },
    async updateProfile() {
      throw new Error("updateProfile is not used in login tests");
    },
    async updatePassword() {
      throw new Error("updatePassword is not used in login tests");
    },
    async updateStatus() {
      throw new Error("updateStatus is not used in login tests");
    },
    async listUsers() {
      throw new Error("listUsers is not used in login tests");
    },
  };

  return { repo, lookupEmails };
}

function createIssuer() {
  const issued: Array<{ subject: string; role: string }> = [];
  const issuer = (subject: string, role: string) => {
    issued.push({ subject, role });
    return "test-token";
  };
  return { issued, issuer };
}

test("valid login issues a token with user id and role, returns safe user", async () => {
  const { repo, lookupEmails } = createRepository(createCredentials());
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  const result = await login({
    email: "  User@Example.COM  ",
    password: "correct-password",
  });

  assert.equal(result.accessToken, "test-token");
  assert.deepEqual(issued, [{ subject: "user-1", role: "CUSTOMER" }]);
  assert.equal(result.user.id, "user-1");
  assert.equal(result.user.email, "user@example.com");
  assert.equal("passwordHash" in result.user, false);
  assert.deepEqual(lookupEmails, ["user@example.com"]);
});

test("wrong password throws InvalidCredentialsError and issues no token", async () => {
  const { repo } = createRepository(createCredentials());
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  await assert.rejects(
    login({ email: "user@example.com", password: "wrong-password" }),
    InvalidCredentialsError,
  );
  assert.deepEqual(issued, []);
});

test("unknown email throws InvalidCredentialsError and issues no token", async () => {
  const { repo } = createRepository(createCredentials());
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  await assert.rejects(
    login({ email: "nobody@example.com", password: "correct-password" }),
    InvalidCredentialsError,
  );
  assert.deepEqual(issued, []);
});

test("suspended user with valid password throws SuspendedAccountError and issues no token", async () => {
  const { repo } = createRepository(createCredentials({ status: "SUSPENDED" }));
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  await assert.rejects(
    login({ email: "user@example.com", password: "correct-password" }),
    SuspendedAccountError,
  );
  assert.deepEqual(issued, []);
});

test("NULL passwordHash is treated as invalid credentials", async () => {
  const { repo } = createRepository(createCredentials({ passwordHash: null }));
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  await assert.rejects(
    login({ email: "user@example.com", password: "correct-password" }),
    InvalidCredentialsError,
  );
  assert.deepEqual(issued, []);
});

test("pending-approval user with valid password throws PendingApprovalAccountError and issues no token", async () => {
  const { repo } = createRepository(createCredentials({ status: "PENDING_APPROVAL", role: "RESTAURANT" }));
  const { issued, issuer } = createIssuer();
  const login = loginUser(repo, issuer);

  await assert.rejects(
    login({ email: "user@example.com", password: "correct-password" }),
    PendingApprovalAccountError,
  );
  assert.deepEqual(issued, []);
});

test("malformed request fails zod validation", () => {
  assert.throws(() => loginUserSchema.parse({}), Error);
  assert.throws(() => loginUserSchema.parse({ email: "not-an-email" }), Error);
  assert.throws(
    () => loginUserSchema.parse({ email: "user@example.com", password: "" }),
    Error,
  );
});