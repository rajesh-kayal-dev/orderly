import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../lib/api/errors";
import { formatDate } from "../lib/utils/format";

describe("API Error & Formatting", () => {
  it("creates ApiError with status, code, and details", () => {
    const error = new ApiError("Invalid credentials", 401, "UNAUTHORIZED", { reason: "bad_password" });

    assert.equal(error.name, "ApiError");
    assert.equal(error.message, "Invalid credentials");
    assert.equal(error.status, 401);
    assert.equal(error.code, "UNAUTHORIZED");
    assert.deepEqual(error.details, { reason: "bad_password" });
  });

  it("handles null or undefined dates gracefully", () => {
    assert.equal(formatDate(null), "-");
    assert.equal(formatDate(undefined), "-");
    assert.equal(formatDate(""), "-");
  });

  it("formats valid date strings correctly", () => {
    const formatted = formatDate("2026-09-22T12:00:00Z");
    assert.ok(formatted.includes("2026"));
  });
});
