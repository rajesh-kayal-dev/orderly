import { Kafka, logLevel } from "kafkajs";
import type { EventsConfig } from "./config.js";

export function createKafka(config: EventsConfig): Kafka {
  return new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    // Omitted entirely unless configured, so a local PLAINTEXT broker keeps
    // connecting over net.connect with no TLS and no authentication.
    ...(config.ssl ? { ssl: true } : {}),
    ...(config.sasl ? { sasl: config.sasl } : {}),
    logLevel: process.env.KAFKA_LOG_LEVEL ? (logLevel as any)[process.env.KAFKA_LOG_LEVEL] : logLevel.NOTHING,
    retry: {
      initialRetryTime: 300,
      retries: 2,
    },
  });
}
