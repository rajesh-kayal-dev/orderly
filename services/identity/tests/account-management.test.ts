import { test } from "node:test";
import assert from "node:assert/strict";
import { approveUser } from "../src/application/account/approve-user.js";
import {
  InvalidStatusTransitionError,
  RejectionNotSupportedError,
  SelfStatusChangeError,
  UserNotFoundError,
} from "../src/application/account/errors.js";
import { listPendingApprovals } from "../src/application/account/list-pending-approvals.js";
import { listUsers } from "../src/application/account/list-users.js";
import { rejectUser } from "../src/application/account/reject-user.js";
import { updateUserStatus } from "../src/application/account/update-user-status.js";
import {
  createFakeUserRepository,
  makeUser,
} from "./helpers/fake-user-repository.js";

test("admin suspends an ACTIVE user and records the actor", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "CUSTOMER", status: "ACTIVE" }),
  ]);

  const result = await updateUserStatus(repo)("u1", "SUSPENDED", "admin-1");

  assert.equal(result.status, "SUSPENDED");
  assert.equal(result.statusChangedBy, "admin-1");
  assert.ok(result.statusChangedAt instanceof Date);
});

test("admin activates a SUSPENDED restaurant", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "RESTAURANT", status: "SUSPENDED" }),
  ]);

  const result = await updateUserStatus(repo)("u1", "ACTIVE", "admin-1");

  assert.equal(result.status, "ACTIVE");
  assert.equal(result.statusChangedBy, "admin-1");
});

test("admin cannot transition a PENDING_APPROVAL user through the status endpoint", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "RESTAURANT", status: "PENDING_APPROVAL" }),
  ]);

  await assert.rejects(
    updateUserStatus(repo)("u1", "ACTIVE", "admin-1"),
    InvalidStatusTransitionError,
  );
});

test("re-approving an already ACTIVE user via the status endpoint is rejected", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "CUSTOMER", status: "ACTIVE" }),
  ]);

  await assert.rejects(
    updateUserStatus(repo)("u1", "ACTIVE", "admin-1"),
    InvalidStatusTransitionError,
  );
});

test("administrator cannot change their own status", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("admin-1", { role: "ADMIN", status: "ACTIVE" }),
  ]);

  await assert.rejects(
    updateUserStatus(repo)("admin-1", "SUSPENDED", "admin-1"),
    SelfStatusChangeError,
  );
});

test("updating the status of an unknown user throws UserNotFoundError", async () => {
  const { repo } = createFakeUserRepository([]);

  await assert.rejects(
    updateUserStatus(repo)("missing", "SUSPENDED", "admin-1"),
    UserNotFoundError,
  );
});

test("approve activates a pending restaurant and records the actor", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "RESTAURANT", status: "PENDING_APPROVAL" }),
  ]);

  const result = await approveUser(repo)("u1", "admin-1");

  assert.equal(result.status, "ACTIVE");
  assert.equal(result.statusChangedBy, "admin-1");
});

test("approve activates a pending delivery partner", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "DELIVERY_PARTNER", status: "PENDING_APPROVAL" }),
  ]);

  const result = await approveUser(repo)("u1", "admin-1");

  assert.equal(result.status, "ACTIVE");
});

test("approve rejects users that are not pending", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "RESTAURANT", status: "ACTIVE" }),
    makeUser("u2", { role: "CUSTOMER", status: "PENDING_APPROVAL" }),
  ]);

  await assert.rejects(approveUser(repo)("u1", "admin-1"), InvalidStatusTransitionError);
  await assert.rejects(approveUser(repo)("u2", "admin-1"), InvalidStatusTransitionError);
});

test("approving an unknown user throws UserNotFoundError", async () => {
  const { repo } = createFakeUserRepository([]);

  await assert.rejects(approveUser(repo)("missing", "admin-1"), UserNotFoundError);
});

test("reject validates the target is a pending approval then reports the missing persistence", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "DELIVERY_PARTNER", status: "PENDING_APPROVAL" }),
    makeUser("u2", { role: "RESTAURANT", status: "ACTIVE" }),
  ]);

  await assert.rejects(rejectUser(repo)("u1", "admin-1"), RejectionNotSupportedError);
  await assert.rejects(rejectUser(repo)("u2", "admin-1"), InvalidStatusTransitionError);
  await assert.rejects(rejectUser(repo)("missing", "admin-1"), UserNotFoundError);
});

test("listPendingApprovals returns only pending approval-required roles", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "RESTAURANT", status: "PENDING_APPROVAL" }),
    makeUser("u2", { role: "DELIVERY_PARTNER", status: "PENDING_APPROVAL" }),
    makeUser("u3", { role: "RESTAURANT", status: "ACTIVE" }),
    makeUser("u4", { role: "CUSTOMER", status: "SUSPENDED" }),
    makeUser("u5", { role: "CUSTOMER", status: "PENDING_APPROVAL" }),
  ]);

  const pending = await listPendingApprovals(repo)();

  assert.deepEqual(
    pending.map((user) => user.id).sort(),
    ["u1", "u2"],
  );
});

test("listUsers filters by status and paginates", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { role: "CUSTOMER", status: "ACTIVE" }),
    makeUser("u2", { role: "CUSTOMER", status: "SUSPENDED" }),
    makeUser("u3", { role: "CUSTOMER", status: "ACTIVE" }),
  ]);

  const active = await listUsers(repo)({ status: "ACTIVE" });
  assert.equal(active.total, 2);
  assert.equal(active.users.length, 2);

  const firstPage = await listUsers(repo)({ limit: 1, offset: 0 });
  assert.equal(firstPage.users.length, 1);

  const hugeLimit = await listUsers(repo)({ limit: 500 });
  assert.equal(hugeLimit.users.length, 3, "limit is clamped to 100");
});