# Operational Runbook: Microservice Troubleshooting & Recovery

## 1. Overview
This runbook provides emergency diagnosis and recovery procedures for Orderly microservices (`identity`, `restaurant`, `order`, `payment`, `delivery`, `notification`, `gateway`).

---

## 2. Health & Status Verification

Check running service status across Docker and Node processes:

```bash
# Check containerized infrastructure (PostgreSQL & Kafka)
docker ps

# Check microservice port listeners
# Gateway: 5000 / 4000
# Identity: 3001
# Restaurant: 3002
# Order: 3003
# Payment: 3004
# Delivery: 3005
# Notification: 3006
```

---

## 3. Service Failure Diagnosis & Restart

If a specific microservice is unresponsive:

1. **Inspect Logs:**
   Check the relevant terminal or PM2/Docker logs for unhandled exceptions or database connection timeouts.

2. **Verify PostgreSQL Connectivity:**
   Ensure the service database is reachable:
   ```bash
   pnpm --filter @orderly/<service-name> exec prisma db pull --print
   ```

3. **Restart the Individual Service:**
   ```bash
   pnpm --filter @orderly/<service-name> run dev
   ```

---

## 4. Gateway Edge Recovery

If the API Gateway (`apps/gateway`) is failing to route requests:

1. **Verify Downstream Ports:** Ensure environment variables in `.env` match active microservice ports.
2. **Check Socket.IO WebSocket Connection:** Verify clients can establish WebSocket handshakes without CORS rejections.
3. **Restart Gateway:**
   ```bash
   pnpm --filter @orderly/gateway run dev
   ```
