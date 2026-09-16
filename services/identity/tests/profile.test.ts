import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { changePassword } from "../src/application/account/change-password.js";
import { PasswordMismatchError, UserNotFoundError } from "../src/application/account/errors.js";
import { getCurrentUser } from "../src/application/account/get-current-user.js";
import { updateProfile } from "../src/application/account/update-profile.js";
import { changePasswordSchema, updateProfileSchema } from "../src/interfaces/http/auth.schemas.js";
import {
  createFakeUserRepository,
  makeUser,
} from "./helpers/fake-user-repository.js";

test("getCurrentUser returns the user for a known id", async () => {
  const { repo } = createFakeUserRepository([makeUser("u1")]);

  const user = await getCurrentUser(repo)("u1");

  assert.equal(user.id, "u1");
  assert.equal(user.email, "u1@example.com");
});

test("getCurrentUser throws for an unknown id", async () => {
  const { repo } = createFakeUserRepository([]);

  await assert.rejects(getCurrentUser(repo)("missing"), UserNotFoundError);
});

test("updateProfile updates fullName and clears phoneNumber when null", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { phoneNumber: "1234567890" }),
  ]);

  const user = await updateProfile(repo)("u1", {
    fullName: "New Name",
    phoneNumber: null,
  });

  assert.equal(user.fullName, "New Name");
  assert.equal(user.phoneNumber, null);
});

test("updateProfile throws for an unknown id", async () => {
  const { repo } = createFakeUserRepository([]);

  await assert.rejects(updateProfile(repo)("missing", { fullName: "New Name" }), UserNotFoundError);
});

test("changePassword rejects a wrong current password", async () => {
  const { repo } = createFakeUserRepository([
    makeUser("u1", { passwordHash: bcrypt.hashSync("current-password", 4) }),
  ]);

  await assert.rejects(
    changePassword(repo)("u1", {
      currentPassword: "wrong-password",
      newPassword: "a-new-password",
    }),
    PasswordMismatchError,
  );
});

test("changePassword updates the stored hash when current password matches", async () => {
  const { repo, records } = createFakeUserRepository([
    makeUser("u1", { passwordHash: bcrypt.hashSync("current-password", 4) }),
  ]);

  await changePassword(repo)("u1", {
    currentPassword: "current-password",
    newPassword: "a-new-password",
  });

  const storedHash = records()[0].passwordHash;
  assert.ok(storedHash);
  assert.notEqual(storedHash, bcrypt.hashSync("current-password", 4));
  assert.equal(await bcrypt.compare("a-new-password", storedHash), true);
  assert.equal(await bcrypt.compare("current-password", storedHash), false);
});

test("updateProfileSchema rejects empty updates", () => {
  assert.throws(() => updateProfileSchema.parse({}), Error);
});

test("updateProfileSchema accepts a single field or a null phoneNumber", () => {
  assert.equal(updateProfileSchema.parse({ fullName: "New Name" }).fullName, "New Name");
  assert.equal(updateProfileSchema.parse({ phoneNumber: null }).phoneNumber, null);
  assert.equal(updateProfileSchema.parse({ phoneNumber: "555-0100" }).phoneNumber, "555-0100");
});

test("changePasswordSchema validates password rules", () => {
  assert.throws(() => changePasswordSchema.parse({ currentPassword: "x", newPassword: "short" }), Error);
  assert.equal(
    changePasswordSchema.parse({ currentPassword: "current", newPassword: "password123" }).newPassword,
    "password123",
  );
});