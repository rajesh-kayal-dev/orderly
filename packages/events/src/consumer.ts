import { type Consumer, type Kafka } from "kafkajs";
import {
  EVENT_TYPES,
  decodeEnvelope,
  topicOf,
  type EventEnvelope,
  type EventType,
  type PayloadOf,
} from "@orderly/contracts";

export interface ConsumerContext {
  topic: string;
  partition: number;
  offset: string;
  timestamp: number;
  key: string | null;
}

export type EventHandler<K extends EventType = EventType> = (
  envelope: EventEnvelope<PayloadOf<K>>,
  context: ConsumerContext,
) => Promise<void> | void;

export type HandlerMap = { [K in EventType]?: EventHandler<K> };

export interface SubscribeOptions {
  groupId: string;
  fromBeginning?: boolean;
  handlers: HandlerMap;
}

export interface OrderlyConsumer {
  connect(options: SubscribeOptions): Promise<void>;
  disconnect(): Promise<void>;
}

const GROUP_ASSIGNMENT_TIMEOUT_MS = 30_000;

interface GroupAssignmentWaiter {
  wait: Promise<void>;
  cancel(): void;
}

function waitForGroupAssignment(consumer: Consumer): GroupAssignmentWaiter {
  let timeout: NodeJS.Timeout | undefined;
  let unsubscribe: (() => void) | undefined;

  const cleanup = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    unsubscribe?.();
    unsubscribe = undefined;
  };

  const wait = new Promise<void>((resolve, reject) => {
    unsubscribe = consumer.on(consumer.events.GROUP_JOIN, () => {
      cleanup();
      resolve();
    });
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Kafka consumer group assignment timed out after ${GROUP_ASSIGNMENT_TIMEOUT_MS}ms`));
    }, GROUP_ASSIGNMENT_TIMEOUT_MS);
  });

  return { wait, cancel: cleanup };
}

type RawHandler = (envelope: EventEnvelope, context: ConsumerContext) => Promise<void> | void;

export async function handleEnvelope(handlers: HandlerMap, envelope: EventEnvelope, context: ConsumerContext): Promise<void> {
  const handler = handlers[envelope.type];
  if (handler === undefined) {
    return;
  }
  await (handler as RawHandler)(envelope, context);
}

export interface DecodableMessage {
  key: Buffer | null;
  value: Buffer | null;
}

export interface RawMessageContext {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
}

export async function dispatchKafkaMessage(
  handlers: HandlerMap,
  message: DecodableMessage,
  meta: RawMessageContext,
  onError?: (error: unknown, context: ConsumerContext) => void,
): Promise<void> {
  const envelope = decodeEnvelope(message.value);
  if (envelope === null) {
    onError?.(
      new Error("Failed to decode Kafka value into an event envelope"),
      { topic: meta.topic, partition: meta.partition, offset: meta.offset, timestamp: Number(meta.timestamp), key: message.key === null ? null : message.key.toString("utf8") },
    );
    return;
  }
  const context: ConsumerContext = {
    topic: meta.topic,
    partition: meta.partition,
    offset: meta.offset,
    timestamp: Number(meta.timestamp),
    key: message.key === null ? null : message.key.toString("utf8"),
  };
  try {
    await handleEnvelope(handlers, envelope, context);
  } catch (error) {
    onError?.(error, context);
  }
}

export function createEventConsumer(kafka: Kafka): OrderlyConsumer {
  let consumer: Consumer | undefined;

  async function connect(options: SubscribeOptions): Promise<void> {
    if (consumer !== undefined) {
      throw new Error("Event consumer is already connected");
    }
    const topics = [
      ...new Set(EVENT_TYPES.filter((type) => options.handlers[type] !== undefined).map((type) => topicOf(type))),
    ];
    if (topics.length === 0) {
      throw new Error("Event consumer requires at least one handler");
    }

    const active: Consumer = kafka.consumer({ groupId: options.groupId });
    consumer = active;
    let assignment: GroupAssignmentWaiter | undefined;

    try {
      await active.connect();
      if (options.fromBeginning === undefined) {
        await active.subscribe({ topics });
      } else {
        await active.subscribe({ topics, fromBeginning: options.fromBeginning });
      }

      assignment = waitForGroupAssignment(active);
      await active.run({
        eachMessage: async (payload) => {
          await dispatchKafkaMessage(
            options.handlers,
            payload.message,
            {
              topic: payload.topic,
              partition: payload.partition,
              offset: payload.message.offset,
              timestamp: payload.message.timestamp,
            },
            (error, context) => {
              console.error(`[events] message failed: ${String(error)}`, context);
            },
          );
        },
      });
      await assignment.wait;
    } catch (error) {
      assignment?.cancel();
      consumer = undefined;
      await active.disconnect().catch(() => undefined);
      throw error;
    }
  }

  async function disconnect(): Promise<void> {
    const active = consumer;
    if (active === undefined) {
      return;
    }
    consumer = undefined;
    await active.disconnect();
  }

  return { connect, disconnect };
}
