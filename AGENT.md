# Orderly Engineering Rules

## 1. Project Mission

Orderly is a food-delivery platform being rebuilt from a legacy implementation into a professional pnpm + Turborepo monorepo.

The legacy repository is a SOURCE OF BUSINESS BEHAVIOR ONLY.

Do NOT copy the legacy architecture, folder structure, duplicated models, duplicated backend logic, or implementation patterns.

The new repository is the source of truth.

---

## 2. Architecture

Repository structure:

apps/
  web/
  gateway/

services/
  identity/
  restaurant/
  order/
  payment/
  delivery/
  notification/

packages/
  contracts/
  events/
  config/
  logger/
  utils/

infrastructure/
  postgres/
  kafka/
  docker/

docs/
  architecture/
  adr/
  api/

scripts/

### Service ownership

Identity:
- users
- authentication
- credentials
- roles
- account status
- access tokens

Restaurant:
- restaurants
- menus
- categories
- menu items

Order:
- carts
- orders
- order lifecycle

Payment:
- payments
- payment state
- payment provider integration

Delivery:
- delivery partners
- delivery assignment
- pickup
- delivery lifecycle

Notification:
- notifications
- notification delivery

Gateway:
- external API entry point
- request routing
- authentication boundary where appropriate

Web:
- frontend only

---

## 3. Golden Architecture Rules

Never create a generic "backend" service.

Never move business logic into packages/shared.

Shared packages contain only genuinely shared technical contracts/utilities.

Services own their own domain models and persistence.

Never access another service's database directly.

Cross-service communication must use:
- HTTP/API contracts
- asynchronous events

Do not share Prisma models between services.

Do not create duplicated domain models merely to make imports easier.

Do not introduce abstractions without a concrete need.

Prefer simple, explicit code over framework-heavy Clean Architecture boilerplate.

---

## 4. Domain-First Migration

When implementing functionality from the legacy system:

1. inspect the legacy behavior
2. identify the business capability
3. identify the owning service
4. define the new domain model
5. define the API/event contract
6. implement the feature in the owning service
7. test behavior
8. discard legacy implementation details that do not belong in the new architecture

Never perform blind file-to-file migration.

---

## 5. Identity Rules

Identity owns only identity concerns.

Identity must NOT create:
- customer profiles
- restaurant profiles
- delivery partner domain records
- orders
- carts
- notifications

Registration creates the Identity User.

Role-specific domain records belong to their owning service.

Authentication code must never expose:
- passwordHash
- private keys
- secrets

JWT implementation must be isolated from HTTP route handlers.

Secrets and private keys must never be committed.

---

## 6. TypeScript

Use strict TypeScript.

Use ES modules.

The project uses NodeNext.

Relative imports must use `.js` extensions.

Avoid `any`.

Prefer:
- explicit types for public boundaries
- type-only imports where appropriate
- small focused modules

Do not disable TypeScript strictness to silence an error.

---

## 7. Validation

External input must be validated at the HTTP boundary.

Use Zod for request validation.

Never trust:
- request bodies
- query parameters
- URL parameters
- headers
- external service responses

Validation errors must return predictable API responses.

---

## 8. Database

Each service owns its database schema.

Use Prisma for persistence.

Every schema change must have a migration.

Generated Prisma clients must not be committed.

The generated client must be reproducible in CI.

Never manually edit generated Prisma files.

---

## 9. API Style

Use REST for synchronous service APIs.

Use events for asynchronous workflows.

HTTP handlers should remain thin.

Preferred flow:

HTTP route
→ validation
→ application/use case
→ repository/service
→ persistence/external dependency
→ response

Do not put database queries directly into route handlers.

---

## 10. Error Handling

Use meaningful domain/application errors.

Do not expose stack traces or internal database errors to clients.

Use appropriate HTTP status codes.

Never catch an error only to immediately rethrow it unchanged.

---

## 11. Security

Never commit:
- .env
- passwords
- API keys
- JWT private keys
- certificates
- credentials

Use `.env.example` for required configuration.

Passwords must be hashed using a secure password hashing function.

Authentication tokens must have controlled lifetimes.

Do not implement insecure fallback authentication mechanisms.

---

## 12. Dependencies

Do not install a package unless the feature genuinely requires it.

Before adding a dependency:
1. check whether the repository already has an equivalent
2. prefer existing dependencies
3. add the smallest suitable dependency

Never upgrade unrelated dependencies during feature work.

Never run broad dependency upgrades unless explicitly requested.

---

## 13. File Structure

Create directories only when they are justified by actual code.

Avoid empty architecture folders.

Do not create:
- unnecessary factories
- unnecessary interfaces
- unnecessary base classes
- unnecessary generic helpers

Abstraction must solve an actual problem.

---

## 14. Testing

Every completed feature must be verified.

At minimum:

pnpm turbo build

For API features, test:
- successful request
- validation failure
- authentication/authorization failure where relevant
- duplicate/conflict behavior where relevant
- important error paths

When practical, add automated tests for application/domain logic.

---

## 15. Git Rules

Never work directly on main.

Use feature branches.

Examples:

feature/identity-login
feature/restaurant-menu
feature/order-lifecycle

Bug fixes:

fix/identity-login-validation

Maintenance:

chore/update-ci

Documentation:

docs/order-events

Use conventional commits.

Examples:

feat(identity): implement user login
fix(identity): reject suspended accounts
test(identity): add login tests
chore(ci): generate prisma client during build

Do not create meaningless commits.

Do not squash unrelated work together.

Before committing:

git diff --check
pnpm turbo build
git status

---

## 16. GitHub Workflow

Before starting a feature:

1. update main
2. create a dedicated feature branch
3. push the branch
4. implement the feature
5. test locally
6. review the diff
7. commit
8. push
9. create/update PR
10. wait for CI
11. address review comments
12. merge only when checks are green

Do not push directly to main.

Do not merge failing CI.

Do not delete feature branches unless explicitly requested.

---

## 17. Pull Requests

Every PR must explain:

### Summary
What was implemented?

### Changes
What changed technically?

### Testing
What commands/tests were executed?

### Architecture
How does the change respect service ownership?

### Notes
Mention any deliberate architectural decisions.

PR titles should be concise and conventional.

Example:

feat(identity): implement password login

---

## 18. AI Agent Behavior

The AI agent must:

- inspect before modifying
- explain architectural impact before large changes
- make the smallest reasonable change
- preserve existing working behavior
- follow this file as the highest-level engineering contract
- run validation after implementation
- report failures honestly
- stop when an architectural decision is ambiguous

The AI agent must NOT:

- redesign the architecture without approval
- migrate the whole legacy repository automatically
- create arbitrary new services
- create arbitrary shared packages
- modify unrelated services
- modify main
- bypass tests
- bypass CI
- commit secrets
- install unnecessary packages
- rewrite working code merely for style preference

---

## 19. Migration Strategy

Migration happens capability-by-capability.

Preferred order:

Identity
→ Restaurant
→ Order
→ Payment
→ Delivery
→ Notification
→ Gateway integration
→ Web integration
→ event-driven workflows
→ production hardening

Each service must become independently understandable.

Do not migrate the entire old repository into the new repository.

---

## 20. Definition of Done

A feature is done only when:

- implementation is complete
- architecture boundaries are respected
- validation exists
- build passes
- relevant behavior is tested
- git diff has been reviewed
- no secrets are committed
- conventional commit is created
- branch is pushed
- PR is reviewable
- CI passes

When any of these are missing, report what remains.

---

## 21. Communication Style

Be concise and technical.

Before making a significant architectural change, state:

WHAT
WHY
WHERE
IMPACT

When a requested implementation conflicts with this architecture, stop and explain the conflict before coding.
