import { type Kafka, type Message, type Producer } from "kafkajs";
import {
  createEnvelope,
  encodeEnvelope,
  topicOf,
  type EventEnvelope,
  type EventType,
  type PayloadOf,
  type ServiceName,
} from "@orderly/contracts";

export interface PublishOptions {
  /** Message key used for partitioning. Defaults to the envelope id; pass an entity id (e.g. orderId) for per-entity ordering. */
  key?: string;
}

export interface OrderlyProducer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish<K extends EventType>(type: K, payload: PayloadOf<K>, options?: PublishOptions): Promise<void>;
  send(envelope: EventEnvelope, options?: PublishOptions): Promise<void>;
}

export function createProducer(kafka: Kafka, source: ServiceName): OrderlyProducer {
  const producer: Producer = kafka.producer();

  async function send(envelope: EventEnvelope, key: string | undefined): Promise<void> {
    const message: Message = {
      key: key ?? envelope.id,
      value: encodeEnvelope(envelope),
    };
    await producer.send({
      topic: topicOf(envelope.type),
      messages: [message],
    });
  }

  return {
    async connect() {
      await producer.connect();
    },
    async disconnect() {
      await producer.disconnect();
    },
    async publish(type, payload, options) {
      const envelope = createEnvelope(type, payload, { source });
      await send(envelope, options?.key);
    },
    async send(envelope, options) {
      await send(envelope, options?.key);
    },
  };
}