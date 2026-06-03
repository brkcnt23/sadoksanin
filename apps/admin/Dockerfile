# Development + Production Dockerfile for Nuxt Admin

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

ARG NUXT_APP_BASE_URL=/
ENV NUXT_APP_BASE_URL=$NUXT_APP_BASE_URL
ARG ADMIN_API_BASE=/api
ENV ADMIN_API_BASE=$ADMIN_API_BASE

# Copy root + admin + packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/admin ./apps/admin
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Install dependencies
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Build admin
RUN pnpm -F @sadoksan/admin build

# ============================================================================
# DEVELOPMENT STAGE
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy apps + packages
COPY apps/admin ./apps/admin
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3002

# Dev command
CMD ["pnpm", "-F", "@sadoksan/admin", "run", "dev", "-p", "3002"]

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy everything from builder
COPY --from=builder /app ./

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3002
CMD ["node", "apps/admin/.output/server/index.mjs"]
