# Operational Runbook: Database Migrations & Schema Evolution

## 1. Overview
This runbook defines standard operating procedures for applying, rolling forward, and verifying Prisma database migrations across Orderly microservices.

---

## 2. Standard Migration Workflow

Each microservice manages its own independent PostgreSQL schema. To introduce schema changes:

1. **Modify the Target Service Schema:**
   Edit `services/<service-name>/prisma/schema.prisma`.

2. **Generate Migration (Development):**
   ```bash
   pnpm --filter @orderly/<service-name> exec prisma migrate dev --name <descriptive_name>
   ```

3. **Regenerate Prisma Client:**
   ```bash
   pnpm --filter @orderly/<service-name> run generate
   ```

4. **Verify Service Build & Tests:**
   ```bash
   pnpm --filter @orderly/<service-name> run build
   pnpm --filter @orderly/<service-name> test
   ```

---

## 3. Production Deployment Migration

In production / CI environments, apply pending migrations safely without schema reset:

```bash
# Apply migrations across all microservices
pnpm --filter @orderly/identity exec prisma migrate deploy
pnpm --filter @orderly/restaurant exec prisma migrate deploy
pnpm --filter @orderly/order exec prisma migrate deploy
pnpm --filter @orderly/payment exec prisma migrate deploy
pnpm --filter @orderly/delivery exec prisma migrate deploy
pnpm --filter @orderly/notification exec prisma migrate deploy
```

---

## 4. Troubleshooting Migration Conflicts

If a migration fails due to lock timeouts or connection interruptions:

1. Check migration history status:
   ```bash
   pnpm --filter @orderly/<service-name> exec prisma migrate status
   ```
2. If a migration is marked failed, inspect database locks and resolve manually before marking resolved:
   ```bash
   pnpm --filter @orderly/<service-name> exec prisma migrate resolve --applied <migration_directory_name>
   ```
