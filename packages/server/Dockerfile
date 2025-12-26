# ============================================
# BastionAuth Server - Production Dockerfile
# ============================================

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/server && pnpm prisma generate --schema=src/prisma/schema.prisma

# Build packages
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/server build

# Runner stage - using full node_modules instead of pnpm deploy
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bastionauth

# Copy built server
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/server/src/prisma ./prisma

# Copy built core
COPY --from=builder /app/packages/core/dist ./node_modules/@bastionauth/core/dist
COPY --from=builder /app/packages/core/package.json ./node_modules/@bastionauth/core/

# Copy all node_modules (includes Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Set ownership
RUN chown -R bastionauth:nodejs /app

USER bastionauth

EXPOSE 3001

ENV PORT=3001
ENV HOST=0.0.0.0

# Start server
CMD ["node", "dist/index.js"]
