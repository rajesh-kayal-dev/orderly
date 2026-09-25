# Operational Runbook: Kafka Event Debugging & Stream Inspection

## 1. Overview
This runbook covers procedures for diagnosing event flow issues, verifying topic subscriptions, and troubleshooting Kafka event delivery across Orderly microservices.

---

## 2. Cluster Health Verification

Verify Kafka broker and Zookeeper (or KRaft) container status:

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

---

## 3. Topic Listing & Inspection

List active Orderly domain topics inside the Kafka container:

```bash
docker exec -it orderly-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list | grep orderly
```

Expected core topics:
- `orderly.order.placed`
- `orderly.order.accepted`
- `orderly.order.preparing`
- `orderly.order.ready`
- `orderly.order.assigned`
- `orderly.order.picked_up`
- `orderly.order.delivered`
- `orderly.payment.succeeded`
- `orderly.delivery.in_transit`

---

## 4. Live Event Stream Tailing

Tail incoming messages on a specific domain topic from the beginning:

```bash
docker exec -it orderly-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orderly.order.placed \
  --from-beginning
```

---

## 5. Consumer Group Lag & Reset

If downstream consumers (e.g. `notification`, `delivery`) are stalled:

1. **Check Consumer Group Offsets:**
   ```bash
   docker exec -it orderly-kafka kafka-consumer-groups.sh \
     --bootstrap-server localhost:9092 \
     --describe --group orderly.notification.service
   ```

2. **Handle Poison Messages:**
   If a consumer crashes on a malformed message, verify envelope structure against `@orderly/contracts` `EventEnvelope` schema.
