# ============================================
# BastionAuth Server - Production Dockerfile
# ============================================

FROM node:25-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy all files
COPY . .

# Set pnpm to hoist all dependencies (flat node_modules like npm)
RUN echo "shamefully-hoist=true" >> .npmrc
RUN echo "node-linker=hoisted" >> .npmrc

# Install dependencies with hoisting (can't use frozen-lockfile with new npmrc)
RUN pnpm install

# Generate Prisma client
RUN cd packages/server && pnpm prisma generate --schema=src/prisma/schema.prisma

# Build packages
RUN pnpm --filter @bastionauth/core build
RUN pnpm --filter @bastionauth/server build

# Runner stage
FROM node:25-alpine AS runner
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

# Start server
CMD ["node", "dist/index.js"]
