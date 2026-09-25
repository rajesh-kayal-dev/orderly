# Contributing to Orderly

> **Notice:** Orderly is a proprietary software project. Access to this repository is restricted to authorized contributors and evaluators. Access does not grant rights to redistribute, sublicense, or reuse the source code or assets outside authorized development. Please refer to [LICENSE](LICENSE) for full licensing terms.

---

## 1. Prerequisites

Ensure your development environment meets the following baseline requirements:

- **Node.js**: `v22.x` (LTS recommended)
- **Package Manager**: `pnpm` `v10.x` (`corepack enable` or `npm i -g pnpm@10.33.0`)
- **Docker & Docker Compose**: For running local PostgreSQL, Kafka, and Redis instances
- **Git**: Configured with valid SSH / GPG credentials

---

## 2. Local Setup & Workspace Initialization

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/rajesh-kayal-dev/orderly.git
   cd orderly
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Configure Environment Variables:**
   Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
   *Never commit `.env` or real API keys, passwords, or secrets to Git.*

4. **Start Infrastructure Services (PostgreSQL & Kafka):**
   ```bash
   docker compose -f infrastructure/docker/docker-compose.yml up -d
   ```

5. **Generate Database Clients & Build Packages:**
   ```bash
   pnpm generate
   pnpm build
   ```

6. **Start Development Servers:**
   ```bash
   pnpm dev
   ```

---

## 3. Branching & Commit Conventions

### Branch Naming
- `feature/<short-description>`: New functional features
- `fix/<short-description>`: Bug fixes and regression repairs
- `refactor/<short-description>`: Code quality or cleanup passes
- `docs/<short-description>`: Documentation improvements
- `infra/<short-description>`: CI/CD, Docker, or tooling adjustments

### Conventional Commits
All commits should follow the standard Conventional Commits format:
```text
<type>(<scope>): <short imperative description>
```
*Types:* `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
*Scopes:* `frontend`, `gateway`, `identity`, `restaurant`, `order`, `payment`, `delivery`, `notification`, `contracts`, `events`.

---

## 4. Engineering Standards & Architecture Rules

### 1. Service & Domain Boundaries
- Orderly enforces strict microservice isolation across 6 backend domains (`identity`, `restaurant`, `order`, `payment`, `delivery`, `notification`) plus an `API Gateway` and `React Frontend`.
- **No Shared Databases:** Each microservice strictly owns its own PostgreSQL database schema. Never introduce cross-service foreign keys or direct cross-database queries.
- **Layered Clean Architecture:** Keep business logic inside `domain/` and `application/` layers. Framework adapters and external calls belong in `infrastructure/` and `interfaces/`.

### 2. Frontend Standards
- **TypeScript First:** Application code must use `.ts` and `.tsx`.
- **Hook Rules:** Always place unconditional React hooks before any early returns or auth guards.
- **State Management:** Keep local state local; use Redux slices only for platform-wide state (auth session, global cart).

### 3. API & Contract Integrity
- All REST request/response shapes and Kafka event definitions must be defined in `@orderly/contracts` and `@orderly/events`.
- Centralize frontend HTTP calls in `apps/frontend/src/api/` rather than invoking raw ad-hoc fetch instances inside UI components.

### 4. Asynchronous Events & Kafka
- Microservices communicate state changes asynchronously via domain events (e.g., `order.placed`, `order.accepted`, `payment.succeeded`, `delivery.assigned`).
- Payloads must never contain passwords, tokens, or card CVVs. Consumers must be idempotent.

### 5. Authoritative Pricing
- Price calculation is strictly deterministic and authoritative across the entire order lifecycle:
  $$\text{Grand Total} = (\text{Subtotal} - \text{Discount}) + \text{Delivery Fee} + \text{Platform Fee} + \text{GST (5\%)}$$
- The backend price engine is the source of truth.

---

## 5. Security & Secret Handling

- **Zero Secret Commits:** Do not hardcode API keys, Razorpay credentials, JWT secrets, database connection strings, or SMTP credentials.
- **Role-Based Access Control (RBAC):** Backend endpoints must validate JWT roles (`customer`, `restaurant`, `delivery`, `admin`) and assert resource ownership.
- Consult [SECURITY.md](SECURITY.md) for full vulnerability reporting and security policies.

---

## 6. Pre-Pull Request Verification Checklist

Before submitting a Pull Request, run the full validation suite:

```bash
# 1. Lint check across all monorepo packages
pnpm run lint

# 2. TypeScript static type verification
pnpm run typecheck

# 3. Unit and integration tests
pnpm --filter @orderly/* test

# 4. Production build verification
pnpm run build
```

---

## 7. Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and service topology
- [API.md](API.md) — Gateway routing and service HTTP contracts
- [DATABASE.md](DATABASE.md) — Service-owned database schemas and migration rules
- [EVENTS.md](EVENTS.md) — Kafka event backbone and event catalogue
- [DEPLOYMENT.md](DEPLOYMENT.md) — Operational deployment and infrastructure setup
- [COLLABORATION.md](COLLABORATION.md) — Engineering standards and team practices
- [SECURITY.md](SECURITY.md) — Security policy and vulnerability disclosure
