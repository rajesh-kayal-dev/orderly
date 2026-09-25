# Orderly API

## 1. Purpose

This document describes how Orderly applications and services communicate through APIs.

The public application API is exposed through the Gateway. Domain services own their business operations.

## 2. API Flow

```text
React Frontend
      │
      │ HTTP / WebSocket
      ▼
   Gateway :5001
      │
      ├──► Identity :3001
      ├──► Restaurant :3003
      ├──► Order :3004
      ├──► Payment :3005
      ├──► Delivery :3006
      └──► Notification :3007
```

The frontend should not depend directly on internal service URLs.

## 3. Service Responsibilities

| Service | Primary API responsibility |
|---|---|
| Identity | Registration, login, account/authentication |
| Restaurant | Restaurants, menus, restaurant operations |
| Order | Cart/order lifecycle and order queries |
| Payment | Payment creation, verification, payment state |
| Delivery | Delivery partners, assignment, delivery lifecycle |
| Notification | Notifications and notification-related operations |
| Gateway | Public API boundary and routing/orchestration |

## 4. Request Rules

API requests should:

- Validate input at the boundary
- Authenticate protected requests
- Authorize by role and resource ownership
- Return predictable response shapes
- Avoid leaking internal implementation details
- Never trust client-calculated prices or privileged fields
- Use appropriate HTTP status codes

## 5. Authentication

Protected requests carry the authenticated session/token expected by the Gateway.

The Gateway and owning service must enforce authorization.

A JWT identifies the authenticated account, but account status remains authoritative on the server.

Suspended/blocked accounts must not continue performing protected operations simply because they possess an older token.

## 6. Roles

Supported application roles:

```text
CUSTOMER
RESTAURANT
DELIVERY_PARTNER
ADMIN
```

Typical application routing:

```text
CUSTOMER          → /customer
RESTAURANT        → /restaurant
DELIVERY_PARTNER  → /delivery
ADMIN             → /admin
```

Admin authentication is separate from the normal customer/restaurant/delivery login flow.

## 7. Response Conventions

Successful responses should use a predictable structure appropriate to the existing service contract.

Errors should provide:

- HTTP status
- Safe human-readable message
- Machine-readable error information where useful
- Request/correlation identifier when available

Do not expose:

- Passwords
- Secrets
- JWT signing material
- Internal stack traces
- Sensitive payment/provider credentials

## 8. Common API Categories

### Identity

Examples of responsibilities:

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /auth/logout
```

Exact routes are defined by the implemented Gateway/service contracts.

### Restaurant

Examples:

```text
GET    /restaurants
GET    /restaurants/:id
GET    /restaurants/:id/menu
POST   /restaurants
PATCH  /restaurants/:id
```

### Order

Examples:

```text
POST   /orders
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/status
```

### Payment

Examples:

```text
POST   /payments
POST   /payments/verify
GET    /payments/:id
```

### Delivery

Examples:

```text
GET    /delivery/orders
POST   /delivery/orders/:id/accept
PATCH  /delivery/orders/:id/status
```

### Notification

Examples:

```text
GET    /notifications
PATCH  /notifications/:id/read
```

> These examples describe API responsibilities. The implemented route definitions are the source of truth for exact paths, payloads, and response schemas.

## 9. Pricing and Checkout

Checkout must not trust a total supplied by the browser.

The backend calculates the authoritative amount using:

```text
Items
+ Delivery fee
+ Platform fee
+ Applicable tax
- Valid discount/coupon
= Final payable amount
```

The same authoritative amount must be used for:

- Order creation
- Payment provider
- Database
- Confirmation
- Tracking
- Emails
- Restaurant/admin views

## 10. Payment API Rules

Payment creation must use the server-calculated order total.

A failed payment must not create a falsely confirmed order.

Payment methods should be retryable without requiring a full page refresh.

Webhook/provider callbacks must be verified before changing payment state.

## 11. Inter-Service APIs

Internal APIs are service-to-service contracts.

Rules:

1. Call the owning service for its data.
2. Do not query another service's database directly.
3. Validate internal requests.
4. Keep internal credentials/configuration outside source code.
5. Keep contracts explicit.
6. Use events when the operation does not require an immediate response.

## 12. API Versioning

When a breaking API change is required:

- identify the affected consumers
- update shared contracts
- update Gateway routing
- update clients/services
- update tests
- document the migration

Avoid silently changing an existing contract.

## 13. API Testing

API changes should be covered by appropriate:

- Unit tests
- Service/integration tests
- Gateway tests
- E2E tests

Critical paths include:

- Registration/login
- Role-based access
- Restaurant browsing
- Cart/checkout
- Payment/COD
- Order lifecycle
- Delivery assignment
- Admin operations
- Feedback
- Notifications
