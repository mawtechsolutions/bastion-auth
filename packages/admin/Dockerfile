# ============================================
# BastionAuth Admin Dashboard - Production Dockerfile
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/nextjs/package.json ./packages/nextjs/
COPY packages/admin/package.json ./packages/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source files
COPY packages/core ./packages/core
COPY packages/react ./packages/react
COPY packages/nextjs ./packages/nextjs
COPY packages/admin ./packages/admin
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Build dependencies first
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/react build
RUN pnpm --filter @bastionauth/nextjs build

# Build admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @bastionauth/admin build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/packages/admin/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/packages/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/admin/.next/static ./packages/admin/.next/static

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/admin/server.js"]

