# Production Dockerfile for NestJS API
# Copies the full built monorepo workspace and runs from it.

FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Force pnpm to create flat node_modules (needed for Docker COPY)
ENV PNPM_HOME=/usr/local/bin
RUN pnpm config set node-linker hoisted

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/
COPY apps/api/src ./apps/api/src
COPY packages/shared ./packages/shared

RUN pnpm install --no-frozen-lockfile
RUN pnpm -F @sadoksan/api build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy everything from builder (full monorepo with node_modules)
COPY --from=builder /app ./

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "apps/api/dist/main.js"]
