# Orderly Event Backbone & Asynchronous Architecture

## 1. Overview

Orderly adopts an event-driven microservice architecture powered by Apache Kafka. Domain events publish state changes across service boundaries without introducing synchronous cross-service coupling or cross-database dependencies.

The Event Backbone is governed by:
- `@orderly/contracts`: Strong TypeScript types, event envelope format, event payload validation, topic naming rules.
- `@orderly/events`: Kafka client configuration, resilient producer (`ResilientKafkaProducer`), idempotent consumer (`EventConsumer`), topic administration.

---

## 2. Event Envelope Structure

Every published domain event conforms to the canonical envelope format:

```typescript
export interface EventEnvelope<T = unknown> {
  id: string;              // UUID v4 unique event ID (idempotency key)
  type: EventType;         // Domain event type, e.g. "order.placed"
  source: ServiceName;     // Source microservice, e.g. "order"
  timestamp: string;       // ISO 8601 UTC timestamp
  version: string;         // Schema version, e.g. "1.0.0"
  correlationId?: string;  // Trace ID spanning multiple operations
  causationId?: string;    // ID of the direct event that triggered this event
  payload: T;              // Strongly-typed event payload
}
```

---

## 3. Topic Naming Convention

Topics follow the standard naming structure:

```text
orderly.<category>.<event_action>
```

Examples:
- `orderly.order.placed`
- `orderly.order.accepted`
- `orderly.order.preparing`
- `orderly.order.ready`
- `orderly.order.assigned`
- `orderly.order.picked_up`
- `orderly.order.delivered`
- `orderly.order.cancelled`
- `orderly.payment.created`
- `orderly.payment.succeeded`
- `orderly.payment.failed`
- `orderly.delivery.created`
- `orderly.delivery.assigned`
- `orderly.delivery.in_transit`
- `orderly.delivery.delivered`
- `orderly.notification.sent`

---

## 4. Domain Event Catalogue

### Order Events (`order.*`)
| Event Type | Source Service | Trigger Condition | Primary Consumers |
| :--- | :--- | :--- | :--- |
| `order.placed` | `order` | Customer successfully places order | `notification`, `restaurant`, `payment` |
| `order.accepted` | `restaurant` | Kitchen accepts incoming order | `notification`, `delivery` |
| `order.preparing` | `restaurant` | Kitchen starts cooking | `notification` |
| `order.ready` | `restaurant` | Food ready for pickup | `delivery`, `notification` |
| `order.assigned` | `delivery` | Delivery driver assigned to order | `order`, `notification` |
| `order.picked_up`| `delivery` | Driver picks up order from kitchen | `order`, `notification` |
| `order.delivered`| `delivery` | Driver marks order as delivered | `order`, `notification`, `payment` |
| `order.cancelled`| `order` / `restaurant` | Order cancelled prior to pickup | `payment`, `notification`, `delivery` |

### Payment Events (`payment.*`)
| Event Type | Source Service | Trigger Condition | Primary Consumers |
| :--- | :--- | :--- | :--- |
| `payment.created` | `payment` | Payment intent initialized (COD / Razorpay) | `order` |
| `payment.succeeded` | `payment` | Webhook / verification confirms captured payment | `order`, `notification` |
| `payment.failed` | `payment` | Payment verification failed / rejected | `order`, `notification` |
| `payment.refunded`| `payment` | Refund processed for cancelled order | `notification`, `order` |

### Delivery Events (`delivery.*`)
| Event Type | Source Service | Trigger Condition | Primary Consumers |
| :--- | :--- | :--- | :--- |
| `delivery.created` | `delivery` | Delivery assignment pool created | `notification` |
| `delivery.assigned`| `delivery` | Driver accepts delivery request | `order`, `notification` |
| `delivery.in_transit`| `delivery` | Live GPS tracking & transit active | `notification` |
| `delivery.delivered`| `delivery` | Delivery handoff completed | `order`, `notification` |

### Notification Events (`notification.*`)
| Event Type | Source Service | Trigger Condition | Primary Consumers |
| :--- | :--- | :--- | :--- |
| `notification.sent` | `notification` | Email / Push / Socket notification delivered | Monitoring / Audit |
| `notification.failed` | `notification` | Dispatch failure / downstream error | Monitoring / Alerting |

---

## 5. Security & Privacy Guarantees

1. **No Sensitive Data in Payloads:**
   - Payloads **never** contain credit card numbers, CVVs, passwords, auth tokens, or bank account credentials.
2. **Idempotent Consumers:**
   - Consumers store processed `envelope.id` to guarantee at-least-once message processing without duplicating business actions.
3. **Correlation Tracking:**
   - All events preserve `correlationId` to ensure complete observability from customer checkout through kitchen and delivery.
