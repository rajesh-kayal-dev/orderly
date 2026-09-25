# Security Policy

## Orderly Security Standards

Orderly is a multi-service food-delivery platform handling authentication, customer accounts, restaurant operations, delivery workflows, payments, notifications, and administrative actions.

Security is a core engineering requirement. Features must be designed so that security is enforced by the backend and service boundaries, not only by the frontend.

---

## 1. Authentication

Orderly uses authenticated user accounts and JWT-based authentication.

Supported roles include:

- Customer
- Restaurant
- Delivery Partner
- Admin

Customer, Restaurant, and Delivery Partner accounts use the normal user authentication flow. Admin authentication is handled separately.

Authentication must verify:

- User identity
- Password validity
- Account status
- Token validity
- Token expiration
- Required role

Never treat a frontend flag such as `isLoggedIn` as proof of authentication.

---

## 2. Authorization and RBAC

Every protected backend operation must enforce authorization.

Frontend route protection is not sufficient.

The backend must verify:

```text
Authentication
    +
Role
    +
Resource ownership
    +
Current account status
```

Examples:

- Customers may access only their own protected customer resources.
- Restaurant users may manage only their authorized restaurant.
- Delivery partners may operate only on deliveries assigned or available to them according to business rules.
- Admin operations require admin authorization.

Never trust `userId`, `restaurantId`, `deliveryPartnerId`, or similar identifiers supplied by the client without server-side authorization checks.

---

## 3. Account Status

Orderly supports account management states such as:

- Active
- Suspended
- Blocked
- Archived/Deleted where applicable

Account status must be enforced server-side.

A previously issued JWT must not automatically grant continued access to protected operations after an administrator suspends or blocks an account.

Sensitive operations should resolve the current account state before allowing the operation.

---

## 4. Password Security

Passwords must never be:

- Stored in plaintext
- Logged
- Returned through APIs
- Included in analytics
- Included in error messages

Use the project's approved password hashing mechanism.

Authentication must compare the submitted password against the stored password hash using the appropriate verification function.

Never implement password verification by comparing plaintext passwords with stored hashes.

---

## 5. JWT and Session Security

JWT configuration must be controlled by secure environment configuration.

Never hardcode:

- JWT secrets
- Private keys
- Refresh-token secrets
- OAuth client secrets
- Payment credentials

Tokens should contain only the claims required by the authentication architecture.

Access tokens must have appropriate expiration.

Refresh-token behavior must follow the application's implemented security model.

Logout must invalidate or remove the relevant authentication state according to that model.

---

## 6. Secrets and Environment Variables

Never commit real secrets.

Examples include:

```text
.env
.env.local
production credentials
database passwords
JWT secrets
Google OAuth secrets
Razorpay secrets
VNPay secrets
SMTP credentials
Kafka credentials
```

Safe example configuration may be committed as:

```text
.env.example
```

Example files must contain placeholders, never real credentials.

---

## 7. API Security

All public-facing API endpoints must be reviewed for:

- Authentication requirements
- Role authorization
- Input validation
- Ownership validation
- Rate limiting where appropriate
- Safe error handling
- Sensitive-data exposure

Validate request data at service boundaries.

Do not trust frontend validation as security validation.

---

## 8. Input Validation

Validate:

- Request bodies
- Query parameters
- Route parameters
- IDs
- Pagination values
- Filters
- File uploads where applicable
- Payment data
- Feedback data

Use the project's existing validation system consistently.

Reject malformed or unauthorized requests before business logic executes.

---

## 9. Database Security

Use Prisma/database access through the owning service.

Do not allow one service to bypass another service's database boundary.

Use parameterized queries or Prisma APIs rather than dynamically constructed SQL from untrusted input.

Database credentials must remain server-side.

Do not expose:

- Password hashes
- Internal database IDs unnecessarily
- Database connection strings
- Internal service credentials

through public APIs.

---

## 10. Payment Security

Payment amounts must be calculated and validated server-side.

Never trust a final payment amount supplied by the frontend.

The authoritative order price must be used for:

- Razorpay
- VNPay
- COD
- Order persistence
- Tracking
- Email
- Admin views
- Restaurant views

Payment credentials and provider secrets must remain server-side.

Never log complete payment credentials or sensitive payment information.

---

## 11. Webhooks

Payment/provider webhooks must be validated according to the provider's security mechanism.

Do not mark a payment successful solely because a client reports success.

Server-side payment verification is required before changing authoritative payment/order state.

Webhook processing should be idempotent.

Repeated webhook delivery must not create duplicate orders, payments, or state transitions.

---

## 12. Event and Kafka Security

Kafka events must use the shared contracts defined by the project.

Consumers must validate event data before acting on it.

Event handlers should be idempotent where duplicate delivery is possible.

Do not place secrets, passwords, access tokens, or unnecessary personal information inside Kafka events.

Use the minimum information required by downstream consumers.

---

## 13. Realtime / Socket Security

Socket connections must be authenticated where protected data is involved.

Users must only join rooms/channels they are authorized to access.

Never expose another customer's order, address, payment information, or delivery information through an unauthorized socket subscription.

Server-side authorization must be applied to sensitive realtime events.

---

## 14. Customer Privacy

Only expose customer information required for the current business operation.

Avoid exposing unnecessarily:

- Passwords
- Email addresses
- Phone numbers
- Full addresses
- Authentication tokens
- Internal credentials

Restaurant feedback views, delivery views, admin views, and customer views should each expose only the information appropriate to that role.

---

## 15. Error Handling

Production responses must not expose:

- Stack traces
- Database errors
- Secrets
- Internal filesystem paths
- Internal service credentials
- Authentication internals

Users should receive clear, safe error messages.

Detailed diagnostics belong in secure server-side logs.

---

## 16. Logging

Logs must never contain:

- Passwords
- JWT secrets
- Refresh tokens
- OAuth client secrets
- Payment secrets
- Database passwords

Structured logs should contain enough information to investigate failures without exposing sensitive information.

Use request IDs/correlation IDs where supported.

---

## 17. Admin Security

Administrative actions are high-risk operations.

Actions such as:

- Suspend
- Block
- Archive/Delete
- Approve delivery partner
- Manage users
- Manage restaurants
- Manage delivery partners

must require authenticated admin authorization.

Important administrative actions should be auditable.

Audit records should identify:

- Admin
- Action
- Target
- Timestamp
- Relevant reason/details where applicable

---

## 18. File and Asset Security

Uploaded files must be validated for:

- File type
- File size
- File name
- Storage location

Do not execute uploaded files.

Do not trust file extensions alone.

Avoid exposing private files through publicly predictable URLs when they contain sensitive information.

---

## 19. Dependency Security

Keep dependencies reasonably current within the project's supported versions.

Before adding a dependency:

- Verify its purpose.
- Prefer established packages.
- Avoid unnecessary dependencies.
- Check for known security issues where appropriate.

Do not perform major dependency upgrades as part of unrelated feature work without testing compatibility.

---

## 20. CORS and HTTP Security

Configure CORS deliberately.

Do not use unrestricted origins in production unless there is a documented reason.

Do not allow credentials from arbitrary origins.

Production deployments should use HTTPS.

Security headers should be configured appropriately for the deployed frontend/API architecture.

---

## 21. Guest Sessions

Guest checkout/session state is separate from registered-user authentication.

Guest functionality must never:

- Bypass protected APIs
- Become an alternative authentication mechanism
- Gain access to another user's account
- Reuse another user's JWT
- Expose protected order information

When a user transitions between guest and authenticated states, session boundaries must remain clear.

---

## 22. Security Testing

Security-sensitive changes should include tests for:

- Authentication
- JWT validation
- Role isolation
- Resource ownership
- Suspended users
- Blocked users
- Expired tokens
- Invalid tokens
- Duplicate operations
- Payment verification
- Webhook idempotency
- Unauthorized socket access
- Admin-only operations

A frontend-only test is not sufficient for an authorization requirement.

---

## 23. Security Incident Reporting

If you discover a security vulnerability in Orderly:

1. Do not publicly disclose exploit details immediately.
2. Do not commit credentials or proof-of-concept secrets to the repository.
3. Preserve relevant logs and reproduction information safely.
4. Report the issue privately through the project's designated security contact.
5. Include the affected component, impact, reproduction steps, and suggested mitigation where known.

Security reports should be handled confidentially until the issue has been assessed and, where appropriate, fixed.

---

## 24. Security Review Before Deployment

Before production deployment, verify:

- [ ] No secrets are committed.
- [ ] `.env` files are ignored.
- [ ] Authentication works correctly.
- [ ] JWT configuration is secure.
- [ ] Role authorization is enforced server-side.
- [ ] Account suspension/blocking is enforced server-side.
- [ ] Customer/resource ownership is verified.
- [ ] Payment amounts are server-authoritative.
- [ ] Payment webhooks are verified and idempotent.
- [ ] Sensitive data is not exposed through APIs or sockets.
- [ ] Production error responses do not expose internals.
- [ ] Logs contain no secrets.
- [ ] Admin actions are protected and auditable.
- [ ] Guest sessions cannot access protected data.
- [ ] E2E and security-related tests pass.
- [ ] Production HTTPS/CORS configuration is reviewed.

---

## 25. Reporting a Vulnerability

For private vulnerability reporting, use the project's official security contact configured by the maintainers.

Do not publish sensitive vulnerability details in public issues, pull requests, commits, or documentation.

---

**Orderly Security Policy**

Security requirements apply to all applications, services, packages, infrastructure, APIs, events, and deployment environments in the project.
