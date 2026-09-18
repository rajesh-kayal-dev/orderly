import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { DEFAULT_BROKER, DEFAULT_CLIENT_ID, defineEventsConfig, parseBrokers } from "../src/index.js";

describe("parseBrokers", () => {
  it("defaults to localhost:9092 for undefined input", () => {
    assert.deepStrictEqual(parseBrokers(undefined), [DEFAULT_BROKER]);
  });

  it("defaults for empty and whitespace input", () => {
    assert.deepStrictEqual(parseBrokers(""), [DEFAULT_BROKER]);
    assert.deepStrictEqual(parseBrokers("   "), [DEFAULT_BROKER]);
  });

  it("splits comma-separated brokers and trims whitespace", () => {
    assert.deepStrictEqual(parseBrokers("broker-a:9092, broker-b:9093"), ["broker-a:9092", "broker-b:9093"]);
  });

  it("drops empty entries", () => {
    assert.deepStrictEqual(parseBrokers("broker-a:9092,,broker-b:9093"), ["broker-a:9092", "broker-b:9093"]);
  });

  it("treats a list of only separators as the default", () => {
    assert.deepStrictEqual(parseBrokers(", ,"), [DEFAULT_BROKER]);
  });
});

describe("defineEventsConfig", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("applies defaults", () => {
    delete process.env.KAFKA_CLIENT_ID;
    delete process.env.KAFKA_BROKERS;
    const config = defineEventsConfig();
    assert.strictEqual(config.clientId, DEFAULT_CLIENT_ID);
    assert.deepStrictEqual(config.brokers, [DEFAULT_BROKER]);
  });

  it("prefers explicit overrides over environment", () => {
    process.env.KAFKA_CLIENT_ID = "env-client";
    process.env.KAFKA_BROKERS = "env-broker:9092";
    const config = defineEventsConfig({ clientId: "override-client", brokers: ["override-broker:9092"] });
    assert.strictEqual(config.clientId, "override-client");
    assert.deepStrictEqual(config.brokers, ["override-broker:9092"]);
  });

  it("reads from the environment", () => {
    process.env.KAFKA_CLIENT_ID = "env-client";
    process.env.KAFKA_BROKERS = "env-broker-1:9092, env-broker-2:9093";
    const config = defineEventsConfig();
    assert.strictEqual(config.clientId, "env-client");
    assert.deepStrictEqual(config.brokers, ["env-broker-1:9092", "env-broker-2:9093"]);
  });
});