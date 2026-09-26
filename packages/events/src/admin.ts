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
    // Fetch existing topics to avoid recreating them
    const existingTopics = await admin.listTopics();

    // Determine which topics are missing
    const desiredTopics = topicSpecs();
    const missingTopics = desiredTopics.filter(
      (t) => !existingTopics.includes(t.topic)
    );

    if (missingTopics.length > 0) {
      // Redpanda Serverless requires a minimum replication factor of 3.
      // Use replication factor 3 for any topics that need to be created.
      const topicsToCreate = missingTopics.map((t) => ({
        ...t,
        replicationFactor: 3,
      }));
      await admin.createTopics({ topics: topicsToCreate });
    }

    // Return the full list of desired topics (as before)
    return desiredTopics;
  } finally {
    await admin.disconnect();
  }
}
