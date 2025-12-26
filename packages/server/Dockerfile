# ============================================
# BastionAuth Server - Production Dockerfile
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copy source files
COPY packages/core ./packages/core
COPY packages/server ./packages/server
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Generate Prisma client
RUN cd packages/server && pnpm db:generate

# Build core first, then server
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/server build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bastionauth

# Copy built application
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/server/node_modules ./node_modules
COPY --from=builder /app/packages/core/dist ./node_modules/@bastionauth/core/dist
COPY --from=builder /app/packages/core/package.json ./node_modules/@bastionauth/core/

# Copy Prisma files for migrations
COPY --from=builder /app/packages/server/src/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set ownership
RUN chown -R bastionauth:nodejs /app

USER bastionauth

EXPOSE 3001

ENV PORT=3001
ENV HOST=0.0.0.0

# Start script: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]

