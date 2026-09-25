# Orderly

Orderly is a real-time, multi-role food-delivery platform built as a
TypeScript monorepo. It connects customers, restaurants, delivery
partners, and administrators through a centralized API Gateway,
domain-focused services, PostgreSQL/Prisma persistence, Kafka events,
and realtime UI updates.

> **Status:** Active development / pre-deployment hardening.

## Features

### Customer

-   Browse restaurants and menus
-   Search restaurants and view menu items
-   Add, update, and remove cart items
-   Apply promotional coupons
-   Manage delivery address and contact details
-   Choose supported payment methods, including Cash on Delivery
-   Place and track orders
-   View order history
-   Receive order-status notifications
-   View assigned delivery partner during delivery
-   Submit restaurant feedback after completed orders

### Restaurant

-   Register and authenticate
-   Manage restaurant profile
-   Manage menu categories and menu items
-   Control menu-item availability
-   Receive and process customer orders
-   Accept orders
-   Start preparing orders
-   Mark orders ready for pickup
-   Receive notifications and customer feedback

### Delivery Partner

-   Register as a delivery partner
-   Wait for admin approval
-   Manage online/availability status
-   View available deliveries
-   Accept deliveries
-   Pick up orders
-   Mark orders in transit
-   Complete deliveries
-   View delivery history and earnings

### Admin

-   Separate admin authentication
-   Dashboard and operational overview
-   Manage customers
-   Manage restaurants
-   Manage delivery partners
-   Approve, suspend, or block accounts
-   Monitor orders
-   Receive operational notifications
-   Open management sections directly from notifications
-   Review customer feedback

## Architecture

``` text
                         React + Vite
                         localhost:3000
                               |
                               v
                       +---------------+
                       |  API Gateway  |
                       |    :5001      |
                       +-------+-------+
                               |
        +-----------+----------+----------+-----------+-----------+
        |           |          |          |           |           |
        v           v          v          v           v           v
    Identity   Restaurant    Order     Payment    Delivery   Notification
      :3001       :3003       :3004      :3005       :3006       :3007
        |           |          |          |           |           |
        +-----------+----------+----------+-----------+-----------+
                               |
                    +----------+----------+
                    |                     |
                    v                     v
               PostgreSQL               Kafka
               + Prisma              orderly.*
```

## Repository Structure

``` text
orderly/
├── apps/
│   ├── frontend/          # React + Vite web application
│   ├── gateway/           # API Gateway
│   └── e2e/               # Playwright E2E tests
│
├── services/
│   ├── identity/          # Authentication, users and roles
│   ├── restaurant/        # Restaurants and menus
│   ├── order/             # Cart, pricing and orders
│   ├── payment/           # Payment providers and payment state
│   ├── delivery/          # Delivery partners and deliveries
│   └── notification/      # Notifications and event consumers
│
├── packages/
│   ├── contracts/         # Shared API/domain contracts
│   ├── events/            # Shared Kafka event contracts
│   ├── config/            # Shared configuration
│   ├── logger/            # Shared logging
│   └── utils/             # Shared utilities
│
├── docs/
│   ├── adr/
│   ├── api/
│   └── architecture/
│
├── infrastructure/
│   └── docker/
│
├── scripts/
├── AGENT.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

Generated directories such as `node_modules`, `dist`, `.turbo`, and
Playwright artifacts are not source code and should remain ignored.

## Service Ports

  Component      Purpose                        Port
  -------------- -------------------------- --------
  Frontend       React/Vite application       `3000`
  Gateway        API entry point              `5001`
  Identity       Authentication and users     `3001`
  Restaurant     Restaurant/menu domain       `3003`
  Order          Cart/order domain            `3004`
  Payment        Payment domain               `3005`
  Delivery       Delivery domain              `3006`
  Notification   Notification domain          `3007`
  PostgreSQL     Local database               `5434`

Ports are local-development defaults. The relevant `.env.example` and
package configuration are the source of truth.

## Technology Stack

**Frontend** - React - TypeScript - Vite - Tailwind CSS - React Router -
Centralized API client - Socket-based realtime updates where
implemented - Leaflet/OpenStreetMap for tracking

**Backend** - Node.js - TypeScript - Express - REST APIs - JWT
authentication - Zod validation - Prisma ORM

**Infrastructure** - PostgreSQL - Apache Kafka - Docker - Turborepo -
pnpm

**Testing** - Node/Vitest-style service tests where configured -
Playwright - Playwright MCP for multi-role browser validation

## Authentication

Customer, Restaurant, and Delivery Partner accounts use the same normal
authentication system:

``` text
Register
  -> Identity Service
  -> PostgreSQL
  -> Password verification
  -> JWT
  -> Role resolution
  -> Role-specific dashboard
```

Expected role routing:

``` text
CUSTOMER          -> /customer
RESTAURANT        -> /restaurant
DELIVERY_PARTNER  -> /delivery
ADMIN             -> /admin
```

Admin authentication remains separate.

Guest checkout/session handling is separate from registered-user JWT
authentication.

## Order Lifecycle

``` text
Customer
  -> Restaurant/Menu
  -> Cart
  -> Coupon
  -> Checkout
  -> Payment or COD
  -> Order Placed
  -> Restaurant accepts
  -> Preparing
  -> Ready for pickup
  -> Delivery partner accepts
  -> Picked up
  -> In transit
  -> Delivered
  -> Customer feedback
```

The intended UX is realtime: role dashboards and customer tracking
should update when order state changes instead of requiring manual page
refreshes.

## Event-Driven Communication

Kafka is used for asynchronous service communication. Shared event
definitions live in:

``` text
packages/events/
```

Shared contracts live in:

``` text
packages/contracts/
```

The event namespace is:

``` text
orderly.*
```

Representative events include:

``` text
order.placed
order.accepted
order.preparing
order.ready
order.cancelled

delivery.created
delivery.assigned
delivery.picked_up
delivery.in_transit
delivery.delivered
```

The current source code in `packages/events` and `packages/contracts` is
authoritative for event names and payloads.

## Data Ownership

Each service owns its domain data and persistence logic:

``` text
Identity       -> identity/user data
Restaurant     -> restaurant/menu data
Order          -> cart/order data
Payment        -> payment data
Delivery       -> delivery/partner data
Notification   -> notification data
```

Services communicate through APIs and events. A service should not
directly modify another service's database tables.

Prisma schemas and migrations remain inside their owning service.

## Local Setup

### Prerequisites

Install:

-   Node.js
-   pnpm
-   Docker Desktop
-   PostgreSQL infrastructure
-   Kafka for event-driven workflows

Check versions:

``` bash
node --version
pnpm --version
docker --version
```

### Install dependencies

From the repository root:

``` bash
pnpm install
```

### Environment

Configure the required environment variables using the repository's
`.env.example` files.

Never commit:

``` text
.env
.env.*
```

Real database passwords, JWT private keys, OAuth secrets, and payment
credentials must stay outside Git.

### PostgreSQL

Start the repository's PostgreSQL infrastructure:

``` bash
docker compose -f infrastructure/postgres/docker-compose.yml up -d
```

Verify:

``` bash
docker ps
```

Kafka should be started using the repository's current infrastructure
configuration.

### Start the application

Use the root development command:

``` bash
pnpm dev
```

Individual services can be started with their workspace scripts, for
example:

``` bash
pnpm --filter @orderly/identity dev
pnpm --filter @orderly/restaurant dev
pnpm --filter @orderly/order dev
pnpm --filter @orderly/payment dev
pnpm --filter @orderly/delivery dev
pnpm --filter @orderly/notification dev
```

Use the current `package.json` scripts as the final source of truth for
available commands.

## Database and Prisma

Each database-owning service maintains its own Prisma schema and
migrations.

When changing a schema:

1.  Inspect the service's `prisma/schema.prisma`.
2.  Preserve existing migrations.
3.  Create a new migration for intentional schema changes.
4.  Regenerate the Prisma client when required.
5.  Run the affected service tests.
6.  Run the broader regression suite.

Do not delete historical migrations as part of ordinary cleanup.

## Testing

Run the repository's quality checks before deployment:

``` bash
pnpm typecheck
pnpm test
pnpm build
```

Run browser E2E tests:

``` bash
pnpm --filter @orderly/e2e test
```

The E2E suite uses isolated contexts for:

``` text
Customer
Restaurant
Delivery Partner
Admin
```

Important scenarios include:

-   Authentication and RBAC
-   Restaurant/menu browsing
-   Cart and checkout
-   Coupon/pricing
-   Payment/COD
-   Restaurant order lifecycle
-   Delivery lifecycle
-   Customer tracking
-   Notifications
-   Admin management
-   Cross-role realtime updates
-   Golden Order lifecycle

## Pricing and Payments

Orderly follows a canonical pricing model:

``` text
Subtotal
- Discount
+ Delivery Fee
+ Platform Fee
+ Applicable Tax
= Final Payable Amount
```

The authoritative final amount must remain consistent across:

``` text
Checkout
Payment
Order database
Confirmation
Tracking
My Orders
Restaurant view
Admin view
Email
```

The frontend must not silently calculate a different final amount from
the backend.

Payment-provider behavior depends on the configured sandbox/production
credentials.

## Notifications and Realtime Updates

The notification system handles platform events such as:

-   New order
-   Order accepted
-   Order preparing
-   Order ready
-   Delivery assigned
-   Delivery picked up
-   Order in transit
-   Order delivered
-   New restaurant registration
-   New delivery partner registration
-   Administrative events

Where realtime support is implemented, dashboards and tracking should
update automatically without manual refresh.

## Security

Security-sensitive areas include:

-   JWT authentication
-   Role-based access control
-   Password hashing
-   Account suspension/blocking
-   API validation
-   Service authorization
-   Payment verification
-   Secret management

Never commit:

``` text
JWT private keys
API secrets
database passwords
payment credentials
OAuth client secrets
production .env files
```

## Development Principles

1.  Keep business domains separated.
2.  Preserve service ownership boundaries.
3.  Communicate across services through APIs/events.
4.  Keep shared contracts in shared packages.
5.  Prefer strict TypeScript and type-safe boundaries.
6.  Keep one authoritative source for business calculations.
7.  Use real persisted data for real features instead of static mocks.
8.  Keep technical infrastructure invisible to end users.
9.  Test before deployment.
10. Keep modules focused and avoid unnecessary abstraction.
11. Never commit secrets.
12. Preserve database migration history.

## Documentation

Additional documentation lives under:

``` text
docs/
├── adr/
├── api/
└── architecture/
```

Read `AGENT.md` before making substantial repository changes.

## Deployment Checklist

Before deployment:

-   [ ] Environment variables configured
-   [ ] No secrets committed
-   [ ] Database migrations verified
-   [ ] PostgreSQL available
-   [ ] Kafka available
-   [ ] Payment provider configured
-   [ ] JWT configuration verified
-   [ ] OAuth/Google configuration verified if enabled
-   [ ] `pnpm install --frozen-lockfile` succeeds
-   [ ] Typecheck passes
-   [ ] Tests pass
-   [ ] Production build passes
-   [ ] Playwright E2E passes
-   [ ] Golden Order passes
-   [ ] Authentication and RBAC verified
-   [ ] Payment and COD flows verified
-   [ ] Realtime updates verified
-   [ ] Email delivery verified
-   [ ] Admin management verified
-   [ ] Pricing consistency verified
-   [ ] Manual UI inspection completed
-   [ ] Final Git diff reviewed

## License

Orderly is currently maintained as a private project. Add the
appropriate license before public distribution.
