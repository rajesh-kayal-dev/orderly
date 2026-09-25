# ADR-0001: Monorepo Workspace and Service Boundaries

**Status:** Accepted
**Date:** 2026-09-25

## Context
Orderly is a full-featured food delivery platform comprising multiple backend domains (identity, restaurant, order, payment, delivery, notification), an API gateway, a client web app, and shared packages (contracts, events, utilities). Managing these components in isolated multi-repo setups creates tooling friction, dependency drift, and uncoordinated schema upgrades.

## Decision
We adopt a **pnpm workspace + Turborepo monorepo** architecture structured as:
- `apps/`: User-facing applications (`frontend`) and API orchestration (`gateway`).
- `services/`: Independent backend microservices (`identity`, `restaurant`, `order`, `payment`, `delivery`, `notification`).
- `packages/`: Shared cross-cutting contracts (`contracts`), event clients (`events`), and utilities (`utils`).

Each service strictly maintains domain isolation and clean layered architecture (`domain`, `application`, `infrastructure`, `interfaces`).

## Consequences
### Positive
- Single atomic repository for cross-cutting features and end-to-end testing.
- Type-safe contract sharing between frontend and backend via workspace packages.
- Fast, cached monorepo builds and linting powered by Turborepo.

### Negative
- Requires strict enforcement of dependency boundaries to prevent monolithic code leakage into shared packages.

## Alternatives Considered
- **Multi-Repository Architecture:** Rejected due to high overhead in cross-service contract synchronization.
- **Single Monolithic Backend:** Rejected due to loss of domain boundary encapsulation and independent service deployment flexibility.
