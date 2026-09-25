# ADR-0003: Event-Driven Architecture with Apache Kafka

**Status:** Accepted
**Date:** 2026-09-25

## Context
In a distributed food delivery system, operations like order placement, kitchen acceptance, driver assignment, payment confirmation, and customer notifications require choreography across multiple services. Synchronous HTTP chaining creates cascading latency, tight coupling, and brittle failure points.

## Decision
We adopt an **Asynchronous Event-Driven Architecture** utilizing **Apache Kafka** as the platform event backbone, standardized via `@orderly/contracts` and `@orderly/events`.

Key implementation details:
1. **Canonical Event Envelope:** All published events wrap strongly-typed payloads in a standard envelope containing UUID idempotency keys, source service, timestamp, version, and correlation IDs.
2. **Topic Hierarchy:** Structured topic naming (`orderly.<domain>.<action>`).
3. **Idempotent Consumption:** Downstream event consumers track processed event IDs to prevent duplicate business actions under at-least-once message delivery semantics.
4. **No Sensitive Data:** Event payloads strictly exclude card details, CVVs, credentials, and access tokens.

## Consequences
### Positive
- Loose coupling between publisher and consumer services.
- High resilience: downstream consumers process events at their own pace without blocking upstream checkout.
- Auditability: Kafka topic event streams provide an immutable log of state transitions.

### Negative
- Requires handling eventual consistency and out-of-order event delivery (mitigated by monotonic status guards).

## Alternatives Considered
- **Direct Synchronous HTTP Chaining:** Rejected due to coupling and lack of fault tolerance during downstream outages.
- **RabbitMQ:** Rejected in favor of Kafka's distributed partition scalability and immutable event log retention.
