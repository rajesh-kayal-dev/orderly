import { type Kafka } from "kafkajs";
import { listTopicNames } from "@orderly/contracts";

export interface TopicSpec {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
}

export function topicSpecs(): TopicSpec[] {
  return listTopicNames().map((topic) => ({
    topic,
    numPartitions: 1,
    replicationFactor: 1,
  }));
}

export async function ensureTopics(kafka: Kafka): Promise<TopicSpec[]> {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const topics = topicSpecs();
    await admin.createTopics({ topics });
    return topics;
  } finally {
    await admin.disconnect();
  }
}