# Orderly Deployment

## 1. Purpose

This document describes the process for running and deploying the complete Orderly platform.

Orderly consists of a frontend, API Gateway, domain services, PostgreSQL, Kafka, and supporting infrastructure.

## 2. Deployment Components

```text
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │ Frontend :3000 │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ Gateway :5001  │
              └───────┬────────┘
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
   Identity       Restaurant       Order
   :3001          :3003            :3004
       │              │              │
       └──────────────┼──────────────┘
                      ▼
               Payment/Delivery/
                Notification

          ┌─────────────────────┐
          │ PostgreSQL + Kafka  │
          └─────────────────────┘
```

## 3. Prerequisites

Development/deployment environments should provide the versions supported by the repository.

Typical requirements:

- Node.js
- pnpm
- Docker
- Docker Compose where used
- PostgreSQL
- Kafka
- Git

Verify the actual versions expected by the current repository configuration before deployment.

## 4. Install Dependencies

From the repository root:

```bash
pnpm install
```

Do not remove or regenerate the lockfile unnecessarily.

## 5. Environment Configuration

Each application/service should receive the environment variables it actually requires.

Typical categories include:

- Database connection
- Kafka connection
- JWT/authentication secrets
- Service URLs
- CORS configuration
- Payment provider credentials
- Google authentication credentials
- Email credentials
- Realtime/socket configuration
- Frontend public configuration

Never commit real production secrets.

Use the repository's environment example files as the source for required variable names.

## 6. Infrastructure Startup

Start required infrastructure before dependent services.

Typical order:

```text
PostgreSQL
   ↓
Kafka
   ↓
Domain services
   ↓
Gateway
   ↓
Frontend
```

If Docker Compose is provided by the repository, prefer the documented Compose workflow.

## 7. Database Setup

Run the appropriate migration workflow for each database/service.

Do not reset production databases as part of normal deployment.

Before production migration:

1. Back up the database.
2. Review the migration.
3. Test it in a non-production environment.
4. Apply it.
5. Verify application health.

## 8. Service Startup

The services use these typical local ports:

| Application | Port |
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

Production ports may differ behind a reverse proxy/load balancer.

## 9. Build

Before deployment, build the affected applications/packages using the repository's configured workspace scripts.

Example:

```bash
pnpm build
```

The exact build command must follow the root `package.json` scripts.

## 10. Health Checks

Before declaring a deployment healthy, verify:

### Frontend

- Application loads
- Assets load correctly
- API base URL is correct
- Authentication works

### Gateway

- Health endpoint works
- Service routing works
- Authentication middleware works
- CORS configuration is correct

### Identity

- Registration works
- Login works
- Role is returned correctly
- Account status is enforced

### Restaurant

- Restaurant listing works
- Menus load
- Restaurant actions work

### Order

- Cart/checkout works
- Pricing is correct
- Orders are created
- Order status transitions work

### Payment

- Payment creation works
- Provider verification works
- Failed payments remain failed/pending correctly
- COD follows the same pricing rules

### Delivery

- Approved partners can receive/accept work
- Unapproved partners cannot accept
- Delivery status transitions work
- Location updates work where enabled

### Notification

- Kafka consumers connect
- Notifications are generated
- Realtime updates work
- Delivery completion email works where configured

## 11. Production Security Checklist

Before exposing Orderly publicly:

- Use HTTPS.
- Keep secrets outside source control.
- Use strong production JWT secrets.
- Restrict database access.
- Restrict Kafka access.
- Configure production CORS explicitly.
- Verify payment webhooks.
- Enable appropriate rate limiting.
- Disable verbose production error output.
- Review admin authentication.
- Verify account suspension is enforced server-side.
- Review logging for sensitive information.
- Keep dependencies updated.
- Configure backups and recovery.

See `SECURITY.md` for the detailed security rules.

## 12. Deployment Order

A safe initial deployment sequence is:

```text
1. Infrastructure
2. Database migrations
3. Identity
4. Restaurant
5. Order
6. Payment
7. Delivery
8. Notification
9. Gateway
10. Frontend
```

If the deployment platform manages dependencies differently, preserve the same dependency relationships rather than blindly following the numeric order.

## 13. Post-Deployment Smoke Test

Run a real end-to-end business flow:

```text
Register Customer
      ↓
Login
      ↓
Browse Restaurant
      ↓
Add Item
      ↓
Checkout
      ↓
Payment/COD
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
      ↓
Customer Feedback
```

Verify the same final order amount throughout the complete flow.

## 14. Realtime Verification

After deployment verify:

- Customer receives restaurant status changes without refresh.
- Delivery partner receives new orders without refresh.
- Customer receives delivery status changes.
- Notification badges update.
- Tracking does not regress to an earlier status.
- Delivery movement updates where implemented.

## 15. Rollback

A deployment must have a rollback plan.

At minimum:

- Keep the previous application version available.
- Do not make irreversible database changes without a recovery plan.
- Back up production data before risky migrations.
- Know how to restore the previous service image/build.
- Verify Kafka/event compatibility during rollback.

Database rollback should not be assumed to be automatic. Some migrations require a forward-fix rather than a destructive rollback.

## 16. Observability

Production should provide enough visibility to diagnose:

- HTTP failures
- Authentication failures
- Payment failures
- Kafka producer failures
- Kafka consumer failures
- Database failures
- Realtime connection failures
- Order lifecycle failures

Use structured logs and correlation/request IDs where supported.

## 17. Deployment Rule

A deployment is not complete merely because the frontend loads.

Orderly is considered operational only when:

```text
Frontend
  +
Gateway
  +
Identity
  +
Restaurant
  +
Order
  +
Payment
  +
Delivery
  +
Notification
  +
PostgreSQL
  +
Kafka
```

work together through the critical order lifecycle.

## 18. Documentation Maintenance

Update deployment documentation whenever changes affect:

- Ports
- Environment variables
- Infrastructure
- Service startup
- Database migrations
- Kafka topics
- Payment providers
- Authentication
- Deployment commands
- Production architecture
