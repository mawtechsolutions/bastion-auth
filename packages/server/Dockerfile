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

# Deploy server with all its dependencies
RUN pnpm --filter @bastionauth/server deploy --prod /app/deploy

# Copy Prisma schema
RUN cp -r packages/server/src/prisma /app/deploy/prisma

# Re-generate Prisma client in the deploy folder
WORKDIR /app/deploy
RUN npx prisma generate --schema=prisma/schema.prisma

# Runner stage
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bastionauth

# Copy deployed application
COPY --from=builder /app/deploy ./

# Set ownership
RUN chown -R bastionauth:nodejs /app

USER bastionauth

EXPOSE 3001

ENV PORT=3001
ENV HOST=0.0.0.0

# Start server
CMD ["node", "dist/index.js"]
