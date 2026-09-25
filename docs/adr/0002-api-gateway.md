# ADR-0002: Centralized API Gateway and Edge Orchestration

**Status:** Accepted
**Date:** 2026-09-25

## Context
Client applications (Customer Web, Restaurant Portal, Delivery Partner, Admin) require a unified, secure entrypoint to access capabilities spanning multiple downstream microservices without exposing internal microservice network topology, ports, or service discovery details directly to public clients.

## Decision
We implement a lightweight, high-performance **API Gateway** (`apps/gateway`) using Express and Socket.IO that acts as the single public entrypoint (`http://localhost:5000` / `http://localhost:4000`).

The Gateway is responsible for:
1. Routing HTTP requests to appropriate microservices based on URL path prefixes (`/auth`, `/restaurants`, `/menu`, `/orders`, `/payments`, `/delivery-partners`, `/admin`, `/notifications`).
2. Centralizing CORS, security headers, request logging, and rate limiting.
3. Managing real-time WebSocket connection rooms (`role_admin`, `join_deliveries`, order-specific rooms) and bridging Kafka events to browser clients.

## Consequences
### Positive
- Clients interact with a clean, unified REST/WebSocket API contract.
- Internal service ports and topologies are completely decoupled from frontend networking.
- Single control point for rate limiting, CORS, and edge observability.

### Negative
- Gateway becomes a critical path component requiring high availability and low latency.

## Alternatives Considered
- **Direct Client-to-Microservice Access:** Rejected due to CORS complexity, public port proliferation, and high client-side routing coupling.
- **Third-Party Commercial Gateways (Kong / Apisix):** Rejected in favor of an in-repo TypeScript gateway tailored directly to our workspace types and Socket.IO real-time channels.
