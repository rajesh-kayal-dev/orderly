export const SUPPORTED_SASL_MECHANISMS = ["plain", "scram-sha-256", "scram-sha-512"] as const;

export type SaslMechanism = (typeof SUPPORTED_SASL_MECHANISMS)[number];

/** Discriminated union so each mechanism stays assignable to KafkaJS `SASLOptions`. */
export type SaslConfig = {
  [M in SaslMechanism]: { mechanism: M; username: string; password: string };
}[SaslMechanism];

export interface EventsConfig {
  clientId: string;
  brokers: string[];
  ssl: boolean;
  sasl?: SaslConfig;
}

export const DEFAULT_BROKER = "localhost:9092";

export const DEFAULT_CLIENT_ID = "orderly";

export const DEFAULT_SASL_MECHANISM: SaslMechanism = "plain";

const TRUTHY_VALUES = new Set(["true", "1", "yes", "on"]);

const FALSY_VALUES = new Set(["false", "0", "no", "off"]);

export function parseBrokers(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim().length === 0) {
    return [DEFAULT_BROKER];
  }
  const brokers = raw
    .split(",")
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0);
  return brokers.length > 0 ? brokers : [DEFAULT_BROKER];
}

export function parseSsl(raw: string | undefined): boolean {
  if (raw === undefined) {
    return false;
  }
  const value = raw.trim().toLowerCase();
  if (value.length === 0) {
    return false;
  }
  if (TRUTHY_VALUES.has(value)) {
    return true;
  }
  if (FALSY_VALUES.has(value)) {
    return false;
  }
  throw new Error(`KAFKA_SSL must be one of true/false, received "${value}"`);
}

function isSaslMechanism(value: string): value is SaslMechanism {
  return (SUPPORTED_SASL_MECHANISMS as readonly string[]).includes(value);
}

/**
 * Builds the SASL options from the environment, or returns undefined when no
 * SASL variable is present so that unauthenticated PLAINTEXT brokers keep
 * working. Credentials are never included in error messages.
 */
export function parseSasl(env: NodeJS.ProcessEnv = process.env): SaslConfig | undefined {
  const username = env.KAFKA_SASL_USERNAME?.trim();
  const password = env.KAFKA_SASL_PASSWORD;
  const rawMechanism = env.KAFKA_SASL_MECHANISM?.trim().toLowerCase();

  if (username === undefined && password === undefined && rawMechanism === undefined) {
    return undefined;
  }
  if (username === undefined || username.length === 0) {
    throw new Error("KAFKA_SASL_USERNAME is required when KAFKA_SASL_PASSWORD is set");
  }
  if (password === undefined || password.length === 0) {
    throw new Error("KAFKA_SASL_PASSWORD is required when KAFKA_SASL_USERNAME is set");
  }
  if (rawMechanism === undefined || rawMechanism.length === 0) {
    return { mechanism: DEFAULT_SASL_MECHANISM, username, password };
  }
  if (!isSaslMechanism(rawMechanism)) {
    throw new Error(
      `KAFKA_SASL_MECHANISM "${rawMechanism}" is not supported, expected one of ${SUPPORTED_SASL_MECHANISMS.join(", ")}`,
    );
  }
  return { mechanism: rawMechanism, username, password };
}

export function defineEventsConfig(
  overrides: Partial<EventsConfig> = {},
  env: NodeJS.ProcessEnv = process.env,
): EventsConfig {
  const sasl = overrides.sasl ?? parseSasl(env);
  return {
    clientId: overrides.clientId ?? env.KAFKA_CLIENT_ID ?? DEFAULT_CLIENT_ID,
    brokers: overrides.brokers ?? parseBrokers(env.KAFKA_BROKERS),
    ssl: overrides.ssl ?? parseSsl(env.KAFKA_SSL),
    ...(sasl === undefined ? {} : { sasl }),
  };
}
