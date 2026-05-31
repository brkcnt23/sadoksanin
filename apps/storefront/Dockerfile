# Development + Production Dockerfile for Nuxt Storefront

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

ARG NUXT_APP_BASE_URL=/
ENV NUXT_APP_BASE_URL=$NUXT_APP_BASE_URL

# Copy root + storefront + packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/storefront ./apps/storefront
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Install dependencies
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

# Build storefront
RUN pnpm -F @sadoksan/storefront build

# ============================================================================
# DEVELOPMENT STAGE
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy apps + packages
COPY apps/storefront ./apps/storefront
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3000

# Dev command
CMD ["pnpm", "-F", "@sadoksan/storefront", "run", "dev"]

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

EXPOSE 3000
CMD ["node", "apps/storefront/.output/server/index.mjs"]
