import { EVENT_TYPES, isEventType, type EventType } from "./event-types.js";
import type { ServiceName } from "./envelope.js";

export const TOPIC_PREFIX = "orderly";

export const TOPIC_SEPARATOR = ".";

export type TopicName = `${typeof TOPIC_PREFIX}${typeof TOPIC_SEPARATOR}${EventType}`;

export function topicOf(event: EventType): TopicName {
  return `${TOPIC_PREFIX}${TOPIC_SEPARATOR}${event}`;
}

export function listTopicNames(): TopicName[] {
  return EVENT_TYPES.map((event) => topicOf(event));
}

export const topicCatalog: Record<EventType, TopicName> = Object.fromEntries(
  EVENT_TYPES.map((event) => [event, topicOf(event)]),
) as Record<EventType, TopicName>;

export function eventTypeFromTopic(topic: string): EventType | null {
  const prefix = `${TOPIC_PREFIX}${TOPIC_SEPARATOR}`;
  if (!topic.startsWith(prefix)) {
    return null;
  }
  const event = topic.slice(prefix.length);
  return isEventType(event) ? event : null;
}

export function consumerGroupId(service: ServiceName, purpose: string): string {
  if (purpose.length === 0) {
    throw new Error("Consumer group purpose must not be empty");
  }
  return `${TOPIC_PREFIX}${TOPIC_SEPARATOR}${service}${TOPIC_SEPARATOR}${purpose}`;
}