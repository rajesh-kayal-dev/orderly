import { Kafka } from "kafkajs";
import type { EventsConfig } from "./config.js";

export function createKafka(config: EventsConfig): Kafka {
  return new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
  });
}