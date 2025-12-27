# ============================================
# BastionAuth Server - Production Dockerfile
# ============================================

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/server/package.json ./packages/server/

# Set pnpm to hoist all dependencies (flat node_modules like npm)
RUN echo "shamefully-hoist=true" >> .npmrc
RUN echo "node-linker=hoisted" >> .npmrc

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source files
COPY packages/core ./packages/core
COPY packages/server ./packages/server
COPY tsconfig.json ./

# Generate Prisma client
RUN cd packages/server && pnpm prisma generate --schema=src/prisma/schema.prisma

# Build packages
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/server build

# Runner stage
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

# Copy node_modules (hoisted - flat structure)
COPY --from=builder /app/node_modules ./node_modules

# Set ownership
RUN chown -R bastionauth:nodejs /app

USER bastionauth

EXPOSE 3001

ENV PORT=3001
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server
CMD ["node", "dist/index.js"]

