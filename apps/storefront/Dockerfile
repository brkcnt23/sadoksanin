# Development + Production Dockerfile for Nuxt Storefront

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root + storefront + packages
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/storefront ./apps/storefront
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

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
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Dev command
CMD ["pnpm", "-F", "@sadoksan/storefront", "run", "dev"]

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package.json
COPY package.json ./

# Copy only built .output from builder
COPY --from=builder /app/apps/storefront/.output ./apps/storefront/.output

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Run Nuxt
CMD ["node", "apps/storefront/.output/server/index.mjs"]
