import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { DEFAULT_BROKER, DEFAULT_CLIENT_ID, defineEventsConfig, parseBrokers, parseSasl, parseSsl } from "../src/index.js";

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

describe("parseSsl", () => {
  it("defaults to disabled when unset or blank", () => {
    assert.strictEqual(parseSsl(undefined), false);
    assert.strictEqual(parseSsl(""), false);
    assert.strictEqual(parseSsl("   "), false);
  });

  it("accepts common truthy and falsy spellings", () => {
    for (const value of ["true", "TRUE", " True ", "1", "yes", "on"]) {
      assert.strictEqual(parseSsl(value), true, value);
    }
    for (const value of ["false", "FALSE", "0", "no", "off"]) {
      assert.strictEqual(parseSsl(value), false, value);
    }
  });

  it("rejects an unrecognised value", () => {
    assert.throws(() => parseSsl("maybe"), /KAFKA_SSL/);
  });
});

describe("parseSasl", () => {
  it("returns undefined when no SASL variable is present", () => {
    assert.strictEqual(parseSasl({}), undefined);
  });

  it("defaults the mechanism to plain", () => {
    assert.deepStrictEqual(parseSasl({ KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass" }), {
      mechanism: "plain",
      username: "user",
      password: "pass",
    });
  });

  it("supports scram-sha-256 and scram-sha-512", () => {
    for (const mechanism of ["scram-sha-256", "scram-sha-512"] as const) {
      assert.deepStrictEqual(parseSasl({ KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass", KAFKA_SASL_MECHANISM: mechanism }), {
        mechanism,
        username: "user",
        password: "pass",
      });
    }
  });

  it("normalises mechanism casing and surrounding whitespace", () => {
    const sasl = parseSasl({ KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass", KAFKA_SASL_MECHANISM: "  SCRAM-SHA-512  " });
    assert.strictEqual(sasl?.mechanism, "scram-sha-512");
  });

  it("trims the username but preserves the password verbatim", () => {
    const sasl = parseSasl({ KAFKA_SASL_USERNAME: "  user  ", KAFKA_SASL_PASSWORD: "  pad  " });
    assert.strictEqual(sasl?.username, "user");
    assert.strictEqual(sasl?.password, "  pad  ");
  });

  it("requires a username and a password together", () => {
    assert.throws(() => parseSasl({ KAFKA_SASL_PASSWORD: "pass" }), /KAFKA_SASL_USERNAME/);
    assert.throws(() => parseSasl({ KAFKA_SASL_USERNAME: "user" }), /KAFKA_SASL_PASSWORD/);
    assert.throws(() => parseSasl({ KAFKA_SASL_USERNAME: "  ", KAFKA_SASL_PASSWORD: "pass" }), /KAFKA_SASL_USERNAME/);
  });

  it("rejects an unsupported mechanism", () => {
    assert.throws(
      () => parseSasl({ KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass", KAFKA_SASL_MECHANISM: "gssapi" }),
      /KAFKA_SASL_MECHANISM/,
    );
  });

  it("never echoes the password or username in validation errors", () => {
    try {
      parseSasl({ KAFKA_SASL_PASSWORD: "sup3r-s3cret" });
      assert.fail("expected parseSasl to throw");
    } catch (error) {
      assert.ok(!String(error).includes("sup3r-s3cret"));
    }
  });
});

describe("defineEventsConfig with SSL and SASL", () => {
  it("leaves a local PLAINTEXT broker unauthenticated when no new variable is set", () => {
    const config = defineEventsConfig({ clientId: "order-service" }, { KAFKA_BROKERS: "localhost:9092" });
    assert.deepStrictEqual(config, { clientId: "order-service", brokers: ["localhost:9092"], ssl: false });
    assert.strictEqual("sasl" in config, false);
  });

  it("builds a managed SSL and SASL configuration from the environment", () => {
    const config = defineEventsConfig(
      { clientId: "order-service" },
      {
        KAFKA_BROKERS: "managed.example:9093",
        KAFKA_SSL: "true",
        KAFKA_SASL_USERNAME: "user",
        KAFKA_SASL_PASSWORD: "pass",
        KAFKA_SASL_MECHANISM: "scram-sha-512",
      },
    );
    assert.deepStrictEqual(config, {
      clientId: "order-service",
      brokers: ["managed.example:9093"],
      ssl: true,
      sasl: { mechanism: "scram-sha-512", username: "user", password: "pass" },
    });
  });

  it("allows SASL without SSL and SSL without SASL", () => {
    const saslOnly = defineEventsConfig({}, { KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass" });
    assert.strictEqual(saslOnly.ssl, false);
    assert.strictEqual(saslOnly.sasl?.mechanism, "plain");

    const sslOnly = defineEventsConfig({}, { KAFKA_SSL: "true" });
    assert.strictEqual(sslOnly.ssl, true);
    assert.strictEqual("sasl" in sslOnly, false);
  });

  it("keeps explicit overrides ahead of the environment", () => {
    const config = defineEventsConfig(
      { clientId: "override-client", brokers: ["override-broker:9092"], ssl: false, sasl: undefined },
      { KAFKA_BROKERS: "env-broker:9092", KAFKA_SSL: "true", KAFKA_SASL_USERNAME: "user", KAFKA_SASL_PASSWORD: "pass" },
    );
    assert.strictEqual(config.clientId, "override-client");
    assert.deepStrictEqual(config.brokers, ["override-broker:9092"]);
    assert.strictEqual(config.ssl, false);
    assert.strictEqual(config.sasl?.username, "user");
  });
});