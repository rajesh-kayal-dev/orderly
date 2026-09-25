# Collaboration Guide

## Orderly Contribution Standards

Orderly is a multi-service TypeScript monorepo. Contributions must preserve the project's domain boundaries, security model, user experience, and production reliability.

This document defines the standard workflow for anyone working on the repository.

---

## 1. Before You Start

Before changing code:

1. Read `README.md`.
2. Read `AGENT.md`.
3. Read relevant architecture documentation under `docs/`.
4. Identify the service or application that owns the feature.
5. Inspect existing implementations before creating new abstractions.
6. Check related tests.
7. Understand API/event contracts before changing them.

Do not begin by rewriting existing code simply because another structure looks preferable.

---

## 2. Choose the Correct Owner

Orderly uses domain ownership.

```text
Identity       → users, authentication, roles
Restaurant     → restaurants, menus, restaurant operations
Order          → cart, pricing, orders
Payment        → payment providers and payment state
Delivery       → delivery partners and delivery lifecycle
Notification   → notifications and event consumers
Frontend       → presentation and user interaction
Gateway        → API boundary/routing
```

Put business logic in the service that owns the domain.

Do not create a generic backend folder to bypass service ownership.

---

## 3. Service Boundaries

Services communicate through:

- APIs
- Shared contracts
- Kafka events

Do not directly access another service's database.

Do not copy another service's business logic into a new service.

If a service needs another service's information, use the existing API/event boundary.

---

## 4. Shared Packages

Use shared packages for genuinely shared concerns:

```text
packages/contracts
packages/events
packages/config
packages/logger
packages/utils
```

Before creating a new shared utility:

1. Search existing packages.
2. Confirm the functionality is genuinely cross-domain.
3. Avoid moving domain-specific logic into shared packages.

Shared packages must not become a dumping ground for unrelated business logic.

---

## 5. Branching

Create a focused branch for meaningful changes.

Recommended naming:

```text
feature/<short-description>
fix/<short-description>
refactor/<short-description>
chore/<short-description>
docs/<short-description>
test/<short-description>
```

Examples:

```text
feature/customer-feedback
fix/payment-total
refactor/frontend-auth
docs/api-authentication
test/golden-order
```

Keep one logical objective per branch whenever practical.

---

## 6. Commits

Use clear, focused commits.

Recommended format:

```text
type(scope): short description
```

Examples:

```text
feat(feedback): add order feedback workflow
fix(auth): restore role-aware session routing
fix(payment): use canonical order total
refactor(frontend): organize feature modules
test(e2e): cover delivery lifecycle
docs(readme): update local setup
```

Avoid commits such as:

```text
update
changes
final
final2
fix stuff
new code
```

Do not mix unrelated refactors into a feature commit unless the refactor is required.

---

## 7. Pull Requests

Pull requests should explain:

### What changed

Briefly describe the implementation.

### Why

Explain the problem or requirement.

### Testing

List the checks performed.

Example:

```text
- pnpm typecheck
- pnpm test
- pnpm build
- Playwright E2E
```

### Risk

Mention database, authentication, payment, event, or deployment risks.

### Screenshots

Include screenshots for meaningful UI changes.

---

## 8. Code Style

Prefer:

- TypeScript
- ES modules
- `const` / `let`
- async/await
- functional React components
- strict typing
- small focused functions
- clear naming
- reusable components
- existing project utilities

Avoid:

- unnecessary classes
- `any`
- duplicated API logic
- duplicated business calculations
- giant components
- deeply nested conditional logic
- commented-out code
- dead code
- random utility files

Do not refactor stable code without a reason.

---

## 9. React Guidelines

Use feature-oriented organization.

Prefer:

```text
features/
  auth/
  customer/
  restaurant/
  delivery/
  admin/
  orders/
  payments/
  notifications/
```

Reusable presentation components belong in appropriate shared component directories.

Keep API/network logic outside UI components when an existing service/API layer is available.

Components should focus on presentation and user interaction.

---

## 10. API Guidelines

When adding an API:

1. Identify the owning service.
2. Validate input.
3. Authenticate when required.
4. Authorize the operation.
5. Verify resource ownership.
6. Implement business logic in the owning domain.
7. Return a consistent response.
8. Add tests.
9. Update contracts/documentation where required.

Never trust IDs or roles sent by the frontend.

---

## 11. Database Changes

Database changes require care.

Before modifying Prisma:

1. Inspect the current schema.
2. Understand existing relationships.
3. Check existing migrations.
4. Avoid destructive changes unless explicitly required.
5. Create a migration.
6. Test the migration.
7. Test existing functionality.

Never delete historical migrations to make a schema look cleaner.

Preserve historical order, payment, delivery, and feedback data.

---

## 12. Event Changes

When adding or changing an event:

1. Update the shared event contract.
2. Update the producer.
3. Update all consumers.
4. Consider duplicate delivery.
5. Preserve backward compatibility where required.
6. Add tests.
7. Verify Kafka behavior.

Do not silently rename an event that other services consume.

Use the shared event definitions rather than duplicating event payload types.

---

## 13. Authentication Changes

Authentication changes require extra review.

Do not create separate authentication logic for Customer, Restaurant, and Delivery Partner unless the architecture explicitly requires it.

Normal registered users should use the common authentication flow and then be routed according to their role.

Admin authentication remains separate.

Never replace JWT/session authentication with frontend-only state.

Test:

- Login
- Logout
- Refresh
- Role routing
- Expired authentication
- Suspended account
- Blocked account
- Protected API access

---

## 14. Payment Changes

Payment code is high risk.

Before changing payment behavior, understand:

```text
Checkout
→ Pricing
→ Order
→ Payment
→ Provider
→ Webhook
→ Order/payment state
```

Never trust a frontend total.

The server must calculate/validate the authoritative amount.

Any payment change must test:

- COD
- Online payment
- Payment failure
- Successful payment
- Webhook handling
- Duplicate webhook
- Order creation
- Pricing/coupon behavior

---

## 15. Realtime Changes

For Socket.IO/realtime functionality:

- Authenticate protected connections.
- Authorize rooms.
- Avoid exposing another user's data.
- Handle reconnects.
- Avoid duplicate event handling.
- Keep event payloads minimal.
- Test multi-role behavior.

The UI should not require manual refresh when a feature is explicitly designed to be realtime.

---

## 16. Notifications

Notifications should be tied to meaningful domain events.

When adding a notification:

1. Identify the source event.
2. Define the recipient.
3. Define the notification payload.
4. Persist it if the system requires history.
5. Update unread counts/badges.
6. Add realtime delivery where supported.
7. Make the notification actionable when appropriate.

Do not create notification logic independently inside multiple frontend components.

---

## 17. Testing Requirements

Every meaningful feature should have appropriate tests.

### Unit/service tests

Test business rules and service behavior.

### Integration tests

Test boundaries between relevant components.

### E2E tests

Test important user workflows using Playwright.

For multi-role workflows use isolated browser contexts:

```text
Customer
Restaurant
Delivery Partner
Admin
```

Do not use multiple accounts in the same browser storage context.

---

## 18. Required Regression

Before merging a substantial change, verify relevant existing flows.

For changes affecting the order lifecycle:

```text
Customer
→ Restaurant
→ Delivery
→ Customer
```

For authentication changes:

```text
Customer
Restaurant
Delivery Partner
Admin
Guest
```

For payment changes:

```text
Coupon
→ Checkout
→ Payment
→ Order
→ Tracking
→ Email
```

For admin changes:

```text
Admin
→ User/Restaurant/Delivery management
→ Status change
→ Backend enforcement
```

---

## 19. Formatting and Linting

Run the repository's configured formatting/linting tools before submitting work.

Do not disable lint rules just to make CI pass.

If a rule is genuinely inappropriate, discuss the rule change separately.

---

## 20. Dependencies

Before adding a package:

- Confirm it is necessary.
- Check whether an existing dependency already provides the functionality.
- Prefer established packages.
- Avoid duplicate libraries for the same problem.
- Add runtime dependencies to the correct package.
- Add tooling only as a development dependency.

Do not perform unrelated major dependency upgrades.

---

## 21. Documentation

Update documentation when behavior or architecture changes.

Relevant documentation may include:

```text
README.md
SECURITY.md
COLLABORATION.md
docs/adr/
docs/api/
docs/architecture/
```

Do not leave documentation describing removed architecture.

Do not document commands that have not been verified against the repository.

---

## 22. Security

Follow `SECURITY.md`.

Never commit:

- Passwords
- API keys
- JWT secrets
- OAuth secrets
- Payment credentials
- Database credentials
- Production `.env` files

Review diffs for accidental secret exposure before committing.

---

## 23. UI/UX

Orderly is intended for normal users, not developers.

UI changes should:

- Use clear language.
- Preserve existing design consistency.
- Provide loading states.
- Provide useful error states.
- Avoid exposing technical IDs unnecessarily.
- Avoid requiring page refresh for intended realtime behavior.
- Confirm destructive actions.
- Work across supported screen sizes.

Do not redesign unrelated screens while implementing a feature.

---

## 24. Cleanup and Refactoring

Refactoring is welcome when it improves:

- Readability
- Maintainability
- Performance
- Testability
- Security
- Architecture

Do not perform broad rewrites without a clear objective.

Before deleting a file:

1. Search references.
2. Check package scripts.
3. Check tests.
4. Check build configuration.
5. Check deployment configuration.
6. Confirm it is genuinely obsolete.

---

## 25. Review Checklist

Before requesting review:

- [ ] Correct service owns the change.
- [ ] No cross-service database access was introduced.
- [ ] Authentication/authorization is enforced server-side.
- [ ] Input is validated.
- [ ] Database changes have migrations.
- [ ] Shared contracts/events are updated if required.
- [ ] Tests were added or updated.
- [ ] Existing tests pass.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] E2E passes where relevant.
- [ ] No secrets are present.
- [ ] Documentation is updated where required.
- [ ] Git diff has been reviewed.
- [ ] No unrelated changes are included.

---

## 26. Definition of Done

A change is complete when:

1. The requested behavior works.
2. The backend enforces the behavior.
3. Unauthorized access is rejected.
4. Data relationships remain correct.
5. Existing workflows still work.
6. Tests cover important behavior.
7. Typecheck/lint/build pass.
8. Documentation is accurate.
9. No secrets are exposed.
10. The final diff contains only intentional changes.

---

## 27. Communication

When discussing implementation work, be specific.

Good:

```text
The Order service currently calculates the discount before tax.
The payment service was recalculating the total independently.
The payment calculation now consumes the authoritative order total.
```

Avoid:

```text
Payment fixed.
Done.
```

For blockers, report:

- What was attempted
- What failed
- Evidence
- What is required to continue
- Whether the issue is local code or external configuration

---

## 28. Ownership and Responsibility

Contributors are responsible for understanding the impact of their changes.

High-risk areas require additional review:

- Authentication
- Authorization
- Payments
- Database migrations
- Kafka event contracts
- Realtime authorization
- Admin operations
- Customer privacy

When uncertain, prefer a small, testable change over a broad rewrite.

---

**Orderly Collaboration Guide**

The objective is to keep Orderly understandable, secure, testable, and maintainable as the platform grows.
