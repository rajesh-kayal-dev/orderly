# Orderly Architecture

## 1. Overview

Orderly is a modular food-delivery platform organized as a pnpm/Turborepo monorepo.

The system separates business domains into independent services while keeping the customer-facing application behind a single API Gateway.

### Core architecture

```text
                    ┌─────────────────────┐
                    │   React / Vite Web   │
                    │      :3000           │
                    └──────────┬──────────┘
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │       Gateway       │
                    │       :5001         │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
     Identity :3001      Restaurant :3003      Order :3004
          │                    │                    │
          │                    │                    │
          └──────────────┬─────┴────────────┬───────┘
                         │                  │
                         ▼                  ▼
                  Payment :3005       Delivery :3006
                         │                  │
                         └──────────┬───────┘
                                    ▼
                           Notification :3007

                    ┌─────────────────────┐
                    │       Kafka         │
                    │  Async event bus     │
                    └─────────────────────┘

                    ┌─────────────────────┐
                    │    PostgreSQL       │
                    │ Service-owned data  │
                    └─────────────────────┘
```

## 2. Repository Structure

```text
apps/
├── gateway/
└── frontend/

services/
├── identity/
├── restaurant/
├── order/
├── payment/
├── delivery/
└── notification/

packages/
├── contracts/
├── events/
├── config/
├── logger/
└── utils/

infrastructure/
├── docker/
├── kafka/
└── postgres/
```

## 3. Applications

### Frontend

`apps/frontend`

Responsibilities:

- Customer interface
- Restaurant interface
- Delivery partner interface
- Admin interface
- Authentication UI
- Cart and checkout UI
- Order tracking UI
- Realtime status/notification UI

The frontend does not communicate directly with domain services. It uses the Gateway as its application API boundary.

### Gateway

`apps/gateway`

Responsibilities:

- Public API entry point
- Request routing
- Authentication verification
- Authorization enforcement at the API boundary
- Service-to-service HTTP orchestration where required
- Consistent API responses
- Realtime/socket gateway responsibilities where applicable

The Gateway must not become a generic business-logic container. Domain rules remain in their owning services.

## 4. Domain Services

### Identity Service

`services/identity`

Owns:

- Customer authentication
- Restaurant authentication
- Delivery partner authentication
- Password hashing
- JWT issuance/validation support
- Role resolution
- Account status
- Registration

Admin authentication is kept separate from normal customer/restaurant/delivery authentication.

### Restaurant Service

`services/restaurant`

Owns:

- Restaurants
- Restaurant profiles
- Menus
- Menu items
- Restaurant availability/status
- Restaurant-side order operations where applicable
- Restaurant feedback visibility

### Order Service

`services/order`

Owns:

- Carts/order creation where applicable
- Orders
- Order items
- Order lifecycle
- Authoritative order totals
- Coupons/discount application as part of pricing flow
- Order history

### Payment Service

`services/payment`

Owns:

- Payment lifecycle
- Payment provider integration
- Payment status
- Payment verification
- COD/payment method handling
- Payment failure handling

Payment must use the same authoritative final amount calculated for the order.

### Delivery Service

`services/delivery`

Owns:

- Delivery partners
- Approval/status
- Online/offline state
- Delivery assignment
- Pickup
- In-transit state
- Delivery completion
- Delivery location/movement data

### Notification Service

`services/notification`

Owns:

- Application notifications
- Notification delivery
- Notification persistence where applicable
- Email-related notification workflows
- Realtime notification delivery

## 5. Shared Packages

### `packages/contracts`

Shared API/request/response contracts and common types that genuinely need to be shared.

### `packages/events`

Kafka event names, payload contracts, and event-related types.

### `packages/config`

Shared configuration conventions and safe configuration helpers.

### `packages/logger`

Common structured logging utilities.

### `packages/utils`

Small, domain-neutral utilities. Business logic must not be hidden here.

## 6. Communication Model

Orderly uses two primary communication patterns.

### Synchronous

Used when the caller needs an immediate response.

```text
Frontend
   │
   ▼
Gateway
   │
   ▼
Domain Service
   │
   ▼
Response
```

Examples:

- Login
- Restaurant listing
- Menu retrieval
- Cart/checkout requests
- Order queries
- Admin queries

### Asynchronous

Used for events that other services need to react to independently.

```text
Service
   │
   ▼
Kafka
   │
   ├──► Consumer A
   ├──► Consumer B
   └──► Consumer C
```

Examples:

- Order created
- Restaurant accepted order
- Order ready
- Delivery assigned
- Order picked up
- Order delivered
- New registration
- New feedback
- Payment state changes

## 7. Data Ownership

Each domain owns its own persistent data.

A service must not directly query another service's database tables.

Cross-domain information should be obtained through:

- APIs
- Events
- Shared contracts/types where appropriate

This keeps service boundaries explicit and prevents hidden database coupling.

## 8. Authentication and Authorization

Normal users share one authentication flow:

```text
Customer
Restaurant
Delivery Partner
        │
        ▼
   Identity Service
        │
        ▼
       JWT
        │
        ▼
     Gateway
```

The authenticated role determines the application area:

```text
CUSTOMER          → /customer
RESTAURANT        → /restaurant
DELIVERY_PARTNER  → /delivery
ADMIN             → /admin
```

Guest checkout/session state is separate from registered-user authentication.

Account status must be checked server-side for protected operations. An old JWT must not bypass a later account suspension or block.

## 9. Order Lifecycle

The primary business lifecycle is:

```text
Browse
  ↓
Restaurant / Menu
  ↓
Cart
  ↓
Checkout
  ↓
Payment / COD
  ↓
Order Placed
  ↓
Restaurant Accepts
  ↓
Preparing
  ↓
Ready
  ↓
Delivery Assigned
  ↓
Picked Up
  ↓
In Transit
  ↓
Delivered
```

The lifecycle may generate Kafka events and realtime updates so that customer, restaurant, delivery, admin, notification, and tracking views remain synchronized.

## 10. Pricing Architecture

Pricing must have one authoritative calculation.

The final price must remain consistent across:

- Cart/checkout
- Payment
- Razorpay/VNPay
- Database order
- Order confirmation
- Tracking
- My Orders
- Restaurant views
- Admin views
- Email notifications

A client-provided total must never be trusted as the authoritative amount.

## 11. Realtime Architecture

Realtime functionality may use event-driven updates and sockets.

Examples:

- Restaurant status changes update customer tracking
- New delivery orders appear without refresh
- Notification badges update automatically
- Delivery status updates customer tracking
- Delivery movement updates the tracking map

Realtime events must reflect the authoritative backend state rather than creating a second independent state machine.

## 12. Architectural Rules

1. Domain logic belongs to the owning service.
2. No direct cross-service database access.
3. Frontend calls the Gateway, not internal services directly.
4. Kafka events must use explicit contracts.
5. Payment amounts are calculated authoritatively on the server.
6. Authentication and authorization are enforced server-side.
7. Realtime state must originate from authoritative backend state.
8. Shared packages should contain genuinely shared concerns only.
9. Infrastructure configuration must remain separate from business logic.
10. Stable business behavior should not be rewritten during structural cleanup without a concrete reason.

## 13. Infrastructure

Local development uses infrastructure components such as:

- PostgreSQL
- Kafka
- Docker

Typical local ports:

| Component | Port |
|---|---:|
| Frontend | `3000` |
| Gateway | `5001` |
| Identity | `3001` |
| Restaurant | `3003` |
| Order | `3004` |
| Payment | `3005` |
| Delivery | `3006` |
| Notification | `3007` |
| PostgreSQL | `5434` |

Ports may be overridden through environment configuration.

## 14. Design Principles

Orderly follows these principles:

- Domain ownership over shared backend logic
- Explicit service boundaries
- API-first synchronous communication
- Event-driven asynchronous communication
- Server-authoritative state
- Secure authentication and authorization
- Observable and testable services
- Minimal coupling
- Clear frontend/backend separation
- Incremental evolution rather than unnecessary rewrites
