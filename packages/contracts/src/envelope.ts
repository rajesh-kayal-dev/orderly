import { randomUUID } from "node:crypto";
import { isEventType, type EventType } from "./event-types.js";
import type { PayloadOf } from "./payloads.js";

export const ServiceName = {
  Identity: "identity",
  Restaurant: "restaurant",
  Order: "order",
  Payment: "payment",
  Delivery: "delivery",
  Notification: "notification",
} as const;

export type ServiceName = (typeof ServiceName)[keyof typeof ServiceName];

export function isServiceName(value: unknown): value is ServiceName {
  return typeof value === "string" && (Object.values(ServiceName) as readonly string[]).includes(value);
}

export const ENVELOPE_VERSION = 1;

export interface EventEnvelope<T = unknown> {
  id: string;
  type: EventType;
  version: number;
  occurredAt: string;
  source: ServiceName;
  payload: T;
}

export interface CreateEnvelopeOptions {
  source: ServiceName;
  id?: string;
  occurredAt?: string;
  version?: number;
}

export function createEnvelope<K extends EventType>(
  type: K,
  payload: PayloadOf<K>,
  options: CreateEnvelopeOptions,
): EventEnvelope<PayloadOf<K>> {
  return {
    id: options.id ?? randomUUID(),
    type,
    version: options.version ?? ENVELOPE_VERSION,
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    source: options.source,
    payload,
  };
}

export function encodeEnvelope(envelope: EventEnvelope): Buffer {
  return Buffer.from(JSON.stringify(envelope), "utf8");
}

export function isEnvelope(value: unknown): value is EventEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    isEventType(candidate.type) &&
    typeof candidate.version === "number" &&
    typeof candidate.occurredAt === "string" &&
    isServiceName(candidate.source) &&
    "payload" in candidate
  );
}

export function decodeEnvelope<T = unknown>(
  value: Uint8Array | Buffer | null | undefined,
): EventEnvelope<T> | null {
  if (value === null || value === undefined || value.byteLength === 0) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value).toString("utf8"));
  } catch {
    return null;
  }
  return isEnvelope(parsed) ? (parsed as EventEnvelope<T>) : null;
}