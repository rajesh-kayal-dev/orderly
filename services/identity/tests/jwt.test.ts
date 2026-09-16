import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { createJwtService } from "../src/infrastructure/security/jwt.js";

const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });

function toPem(keyPair: ReturnType<typeof generateKeyPairSync>, type: "private" | "public"): string {
  if (type === "private") {
    return keyPair.privateKey.export({ type: "pkcs1", format: "pem" }).toString();
  }
  return keyPair.publicKey.export({ type: "pkcs1", format: "pem" }).toString();
}

test("issues an RS256 token that verifies back to subject and role", () => {
  const service = createJwtService({
    privateKey: toPem(keyPair, "private"),
    publicKey: toPem(keyPair, "public"),
    expiresIn: "15m",
  });

  const token = service.issueAccessToken("user-1", "CUSTOMER");
  const payload = service.verifyAccessToken(token);

  assert.equal(payload.sub, "user-1");
  assert.equal(payload.role, "CUSTOMER");
});

test("verification fails when the public key does not match the signing key", () => {
  const otherPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const service = createJwtService({
    privateKey: toPem(keyPair, "private"),
    publicKey: toPem(otherPair, "public"),
    expiresIn: "15m",
  });

  const token = service.issueAccessToken("user-1", "CUSTOMER");

  assert.throws(() => service.verifyAccessToken(token));
});

test("verification rejects a token whose role is not a known role", () => {
  const service = createJwtService({
    privateKey: toPem(keyPair, "private"),
    publicKey: toPem(keyPair, "public"),
    expiresIn: "15m",
  });

  const token = jwt.sign(
    { role: "ROGUE" },
    toPem(keyPair, "private"),
    { algorithm: "RS256", expiresIn: "15m", subject: "user-1" },
  );

  assert.throws(() => service.verifyAccessToken(token));
});

test("verification rejects a token with a missing role", () => {
  const service = createJwtService({
    privateKey: toPem(keyPair, "private"),
    publicKey: toPem(keyPair, "public"),
    expiresIn: "15m",
  });

  const token = jwt.sign(
    {},
    toPem(keyPair, "private"),
    { algorithm: "RS256", expiresIn: "15m", subject: "user-1" },
  );

  assert.throws(() => service.verifyAccessToken(token));
});