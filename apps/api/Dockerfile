# Development + Production Dockerfile for NestJS API

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root + api package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build API
RUN pnpm -F @sadoksan/api build

# ============================================================================
# DEVELOPMENT STAGE
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g pnpm

# Copy root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy app and packages
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Dev command
CMD ["pnpm", "-F", "@sadoksan/api", "run", "dev"]

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package.json for reference
COPY package.json ./

# Copy only built dist from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run compiled app
CMD ["node", "dist/main"]
