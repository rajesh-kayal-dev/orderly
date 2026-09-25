# ADR-0004: Service-Owned Data and Database Isolation

**Status:** Accepted
**Date:** 2026-09-25

## Context
A common architectural pitfall in microservice platforms is sharing a single monolithic database or permitting direct cross-service database queries. This breaks bounded contexts, causes hidden schema coupling, and leads to cascading migration failures.

## Decision
We enforce a strict **Database-per-Service** architectural pattern across all 6 backend domains:
- `services/identity`: Users, passwords, roles, refresh tokens, profiles.
- `services/restaurant`: Restaurants, operating hours, categories, menu items.
- `services/order`: Orders, order line items, order status history.
- `services/payment`: Payment intents, transactions, refunds.
- `services/delivery`: Delivery partners, vehicle profiles, delivery assignments.
- `services/notification`: Notifications, delivery logs, user channels.

Each microservice maintains its own independent Prisma schema (`prisma/schema.prisma`), dedicated migration history, and PostgreSQL connection. Direct cross-database access or cross-service SQL joins are strictly prohibited.

## Consequences
### Positive
- Independent schema evolution and migration lifecycle for every service.
- Strict data encapsulation prevents accidental data corruption across service boundaries.
- Enables individual database scaling or distinct persistence engines per domain if needed.

### Negative
- Joining data across domains requires aggregation via APIs or asynchronous event replication.

## Alternatives Considered
- **Shared Monolithic Database with Shared Schema:** Rejected due to coupling and violation of microservice isolation principles.
