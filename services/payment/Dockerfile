# syntax=docker/dockerfile:1
# Production image for @orderly/payment.
# Build context MUST be the repository root:
#   docker build -f services/payment/Dockerfile -t orderly-payment .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Stage: install workspace dependencies (locked) ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/e2e/package.json apps/e2e/
COPY apps/frontend/package.json apps/frontend/
COPY apps/gateway/package.json apps/gateway/
COPY packages/contracts/package.json packages/contracts/
COPY packages/events/package.json packages/events/
COPY packages/utils/package.json packages/utils/
COPY services/identity/package.json services/identity/
COPY services/restaurant/package.json services/restaurant/
COPY services/order/package.json services/order/
COPY services/payment/package.json services/payment/
COPY services/delivery/package.json services/delivery/
COPY services/notification/package.json services/notification/
RUN pnpm install --frozen-lockfile

# ---- Stage: build workspace packages + this service ----
FROM deps AS build
COPY turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY apps/gateway ./apps/gateway
RUN pnpm exec turbo run build --filter=@orderly/payment

# ---- Stage: prune to production dependencies only ----
FROM build AS pruned
RUN pnpm --filter @orderly/payment deploy --prod /prod/payment

# ---- Stage: runtime ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruned /prod/payment/package.json ./package.json
COPY --from=pruned /prod/payment/node_modules ./node_modules
COPY --from=build /app/services/payment/dist ./dist
USER node
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3   CMD node -e 'fetch("http://127.0.0.1:"+String(process.env.PORT||3005)+"/health").then(function(r){process.exit(r.ok?0:1)}).catch(function(){process.exit(1)})'
CMD ["node", "dist/server.js"]
