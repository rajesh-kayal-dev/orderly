export interface EventsConfig {
  clientId: string;
  brokers: string[];
}

export const DEFAULT_BROKER = "localhost:9092";

export const DEFAULT_CLIENT_ID = "orderly";

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

export function defineEventsConfig(overrides: Partial<EventsConfig> = {}): EventsConfig {
  return {
    clientId: overrides.clientId ?? process.env.KAFKA_CLIENT_ID ?? DEFAULT_CLIENT_ID,
    brokers: overrides.brokers ?? parseBrokers(process.env.KAFKA_BROKERS),
  };
}