import { Kafka, logLevel } from "kafkajs";
import type { EventsConfig } from "./config.js";

export function createKafka(config: EventsConfig): Kafka {
  return new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    logLevel: process.env.KAFKA_LOG_LEVEL ? (logLevel as any)[process.env.KAFKA_LOG_LEVEL] : logLevel.NOTHING,
    retry: {
      initialRetryTime: 300,
      retries: 2,
    },
  });
}