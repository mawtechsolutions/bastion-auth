# ============================================
# BastionAuth Example App - Production Dockerfile
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
COPY apps/example-nextjs/package.json ./apps/example-nextjs/

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
COPY --from=deps /app/apps ./apps

# Copy source files
COPY packages/core ./packages/core
COPY packages/react ./packages/react
COPY packages/nextjs ./packages/nextjs
COPY apps/example-nextjs ./apps/example-nextjs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Build dependencies first
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/react build
RUN pnpm --filter @bastionauth/nextjs build

# Build example app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @bastionauth/example-nextjs build

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
COPY --from=builder /app/apps/example-nextjs/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/example-nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/example-nextjs/.next/static ./apps/example-nextjs/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/example-nextjs/server.js"]

