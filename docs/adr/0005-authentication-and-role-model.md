# ADR-0005: Authentication, Multi-Role RBAC, and Session Model

**Status:** Accepted
**Date:** 2026-09-25

## Context
Orderly serves four distinct user roles with varying levels of trust and responsibilities:
1. **Customer:** Browses menus, manages personal carts, places orders, tracks live deliveries, submits reviews.
2. **Restaurant:** Manages menu items, availability switches, kitchen preparation queues, order acceptances.
3. **Delivery Partner:** Onboards driver credentials, accepts delivery dispatch offers, updates live GPS tracking, completes drop-offs.
4. **Admin:** Full operational oversight, user suspensions, restaurant onboarding verification, delivery approvals, platform financial reviews.

In addition, unauthenticated visitors must be able to browse menus and perform guest checkout without prematurely forcing registration.

## Decision
We implement a **Role-Based Access Control (RBAC)** authentication architecture anchored by the `identity` service and signed JSON Web Tokens (JWT):
1. **JWT Authentication:** Short-lived access tokens containing user ID, email, role, and permissions, paired with secure refresh token rotation.
2. **Backend Enforcement:** Protected endpoints verify JWT signatures, enforce required role claims, and assert resource ownership. Frontend route guards provide navigation routing but backend RBAC is authoritative.
3. **Guest Session Support:** Ephemeral guest sessions allow smooth cart and checkout flows, decoupled from registered customer accounts.
4. **Account Suspension Invalidation:** Suspended or blocked accounts immediately fail authorization checks and terminate active session tokens.

## Consequences
### Positive
- Unified authentication infrastructure with granular, role-isolated permissions.
- Smooth onboarding and conversion with guest checkout support.
- Comprehensive security guardrails protecting administrative and partner endpoints.

### Negative
- Requires maintaining token propagation across gateway routing and microservice headers.

## Alternatives Considered
- **Session-Cookie Storage on Gateway:** Rejected in favor of stateless JWT tokens suitable for distributed microservice scalability.
