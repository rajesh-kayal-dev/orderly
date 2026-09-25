## Summary

<!-- Provide a concise description of the purpose and context of this Pull Request. -->

---

## Type of Change

- [ ] Feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Refactor (code restructuring without functional changes)
- [ ] Documentation (updates or additions to project documentation)
- [ ] Infrastructure (Docker, CI/CD, tooling, or deployment configuration)
- [ ] Security (vulnerability patch, authorization, or secret handling)
- [ ] Performance (optimizations improving latency, throughput, or memory)

---

## Affected Areas

- [ ] Frontend (`apps/frontend`)
- [ ] Gateway (`apps/gateway`)
- [ ] Identity Service (`services/identity`)
- [ ] Restaurant Service (`services/restaurant`)
- [ ] Order Service (`services/order`)
- [ ] Payment Service (`services/payment`)
- [ ] Delivery Service (`services/delivery`)
- [ ] Notification Service (`services/notification`)
- [ ] Shared Packages (`packages/contracts`, `packages/events`, `packages/utils`)
- [ ] Infrastructure (`infrastructure/`)
- [ ] Documentation (`docs/`, `*.md`)

---

## Testing Performed

<!-- Detail the testing performed to validate this change (unit tests, manual flows, E2E). -->
- [ ] Unit tests added / updated and passing (`pnpm --filter @orderly/* test`)
- [ ] Static type check passes (`pnpm run typecheck`)
- [ ] Lint passes with zero errors (`pnpm run lint`)
- [ ] Monorepo build passes (`pnpm run build`)

---

## Database Changes

<!-- Declare whether this change alters any PostgreSQL database schemas or requires Prisma migrations. -->
- [ ] No database changes required
- [ ] Prisma schema modified and migration generated (`prisma migrate dev`)
- [ ] Backward compatibility verified

---

## API & Event Contract Changes

<!-- Declare whether REST endpoints in apps/gateway or Kafka events in packages/contracts are modified. -->
- [ ] No API or Kafka event contract changes
- [ ] Contracts updated in `@orderly/contracts` or `@orderly/events`
- [ ] Consumers updated to handle changes idempotently

---

## Security Considerations

<!-- Note any authentication, RBAC, token handling, or data isolation aspects considered. -->
- [ ] Role-Based Access Control verified
- [ ] No secrets, tokens, or credentials exposed
- [ ] Monotonic state guard and input validation enforced

---

## Checklist

- [ ] My code follows the established coding and architectural guidelines of Orderly.
- [ ] I have self-reviewed my own code diff.
- [ ] Documentation has been updated to reflect any functional or architectural changes.
- [ ] No unrelated or temporary debug files are included.
- [ ] No secrets or `.env` files are committed.
