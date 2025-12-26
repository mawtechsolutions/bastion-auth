# BastionAuth - Project Overview

> Authentication, fortified.

This document provides a comprehensive overview of BastionAuth's architecture, implementation details, current status, and roadmap for future development.

---

## Table of Contents

1. [What We Are Building](#what-we-are-building)
2. [Architecture Overview](#architecture-overview)
3. [Package Structure](#package-structure)
4. [Database Schema](#database-schema)
5. [Authentication Flows](#authentication-flows)
6. [Security Implementation](#security-implementation)
7. [Current Implementation Status](#current-implementation-status)
8. [Next Steps](#next-steps)
9. [Quick Start Commands](#quick-start-commands)
10. [Key Files Reference](#key-files-reference)

---

## What We Are Building

BastionAuth is a **complete, self-hostable enterprise authentication system** — essentially a Clerk/Auth0 alternative that you can run on your own infrastructure. The project is structured as a pnpm monorepo using Turborepo for builds.

### Core Features

| Feature | Description |
|---------|-------------|
| **Complete Authentication** | Email/password, OAuth (Google, GitHub, Microsoft, Apple, LinkedIn), magic links, passkeys |
| **Multi-Factor Authentication** | TOTP (Time-based One-Time Password), backup codes, WebAuthn support |
| **Organizations & RBAC** | Multi-tenancy with customizable role-based access control |
| **Enterprise Security** | Argon2id password hashing, RS256 JWT, rate limiting, HaveIBeenPwned breach detection |
| **Developer Experience** | Beautiful React components, Next.js integration, comprehensive hooks |
| **Admin Dashboard** | User management, audit logs, webhooks, API keys, session management |

### Design Goals

1. **Security First**: Every decision prioritizes security best practices
2. **Developer Experience**: Simple APIs, great documentation, beautiful UI components
3. **Self-Hostable**: Run anywhere with Docker — no vendor lock-in
4. **Extensible**: Easy to add OAuth providers, customize flows, and extend functionality
5. **Type-Safe**: Full TypeScript coverage across all packages

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐         │
│   │   React App      │    │   Next.js App    │    │   Admin Dashboard│         │
│   │                  │    │                  │    │                  │         │
│   │ @bastionauth/    │    │ @bastionauth/    │    │  Next.js 14      │         │
│   │ react            │    │ nextjs           │    │  App Router      │         │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘         │
│            │                       │                       │                    │
└────────────┼───────────────────────┼───────────────────────┼────────────────────┘
             │                       │                       │
             └───────────────────────┼───────────────────────┘
                                     │
                              ┌──────▼──────┐
                              │   HTTPS     │
                              │   :443      │
                              └──────┬──────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────────┐
│                              API LAYER                                          │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│                           ┌────────▼────────┐                                   │
│                           │  Load Balancer  │                                   │
│                           │    (nginx)      │                                   │
│                           └────────┬────────┘                                   │
│                                    │                                            │
│         ┌──────────────────────────┼──────────────────────────┐                 │
│         │                          │                          │                 │
│   ┌─────▼─────┐             ┌──────▼──────┐            ┌──────▼──────┐          │
│   │  Fastify  │             │   Fastify   │            │   Fastify   │          │
│   │  :3001    │             │   :3001     │            │   :3001     │          │
│   └─────┬─────┘             └──────┬──────┘            └──────┬──────┘          │
│         │                          │                          │                 │
│         └──────────────────────────┼──────────────────────────┘                 │
│                                    │                                            │
│                    ┌───────────────┼───────────────┐                            │
│                    │               │               │                            │
│              ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐                      │
│              │  Plugins  │   │  Routes   │   │ Services  │                      │
│              │           │   │           │   │           │                      │
│              │ • Prisma  │   │ • Auth    │   │ • Auth    │                      │
│              │ • Redis   │   │ • Users   │   │ • Email   │                      │
│              │ • CORS    │   │ • Orgs    │   │ • MFA     │                      │
│              │ • Helmet  │   │ • Admin   │   │ • OAuth   │                      │
│              └───────────┘   └───────────┘   │ • Webhook │                      │
│                                              └───────────┘                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼─────────┐    ┌───────────▼───────────┐    ┌─────────▼─────────┐
│    PostgreSQL     │    │        Redis          │    │  External APIs    │
│      :5432        │    │        :6379          │    │                   │
├───────────────────┤    ├───────────────────────┤    ├───────────────────┤
│                   │    │                       │    │                   │
│ • Users           │    │ ┌───────────────────┐ │    │ • Resend (Email)  │
│ • Sessions        │    │ │    Sessions       │ │    │ • HaveIBeenPwned  │
│ • Organizations   │    │ ├───────────────────┤ │    │ • OAuth Providers │
│ • OAuth Accounts  │    │ │  Rate Limiting    │ │    │   - Google        │
│ • Audit Logs      │    │ ├───────────────────┤ │    │   - GitHub        │
│ • Webhooks        │    │ │     Cache         │ │    │   - Microsoft     │
│ • API Keys        │    │ └───────────────────┘ │    │   - Apple         │
│                   │    │                       │    │   - LinkedIn      │
└───────────────────┘    └───────────────────────┘    └───────────────────┘
```

### Data Flow

1. **Client Applications** use the React SDK (`@bastionauth/react`) or Next.js integration (`@bastionauth/nextjs`)
2. **SDK Layer** communicates with the Fastify API server via HTTPS
3. **API Server** (`@bastionauth/server`) handles all authentication logic through services
4. **Data Layer** uses PostgreSQL for persistent storage and Redis for sessions/caching
5. **External Services** handle email delivery (Resend), breach detection (HIBP), and OAuth

---

## Package Structure

### Monorepo Layout

```
bastionauth/
├── packages/
│   ├── core/                    # Shared types and utilities
│   ├── server/                  # Fastify API (PRIMARY)
│   ├── react/                   # React SDK
│   ├── nextjs/                  # Next.js utilities
│   └── admin/                   # Admin dashboard
├── apps/
│   └── example-nextjs/          # Example integration
├── docker/
│   └── docker-compose.yml       # PostgreSQL + Redis
├── docs/                        # Documentation
├── e2e/                         # Playwright E2E tests
├── scripts/                     # Utility scripts
├── turbo.json                   # Turborepo configuration
└── pnpm-workspace.yaml          # Workspace definition
```

---

### 1. @bastionauth/core

**Location:** `packages/core/`

Shared foundation package containing types, constants, and utilities used across all other packages.

**Contents:**

| Directory | Purpose |
|-----------|---------|
| `src/types/` | TypeScript interfaces for User, Session, Organization, TokenPair, API requests/responses |
| `src/constants/` | Error codes, event names, configuration defaults (password rules, token expiry, etc.) |
| `src/utils/` | Validation helpers (email, password strength), common functions |

**Key Exports:**
```typescript
// Types
export type { User, Session, Organization, OrganizationMembership, TokenPair };
export type { SignInRequest, SignUpRequest, ApiError };

// Constants
export { ERROR_CODES, AUDIT_ACTIONS, WEBHOOK_EVENTS };
export { PASSWORD_CONFIG, TOKEN_CONFIG, SESSION_CONFIG, MFA_CONFIG };

// Utilities
export { validateEmail, validatePassword, generateSlug };
```

---

### 2. @bastionauth/server

**Location:** `packages/server/`

The heart of BastionAuth — a Fastify-based API server that handles all authentication logic.

**Structure:**

| Directory | Purpose |
|-----------|---------|
| `src/config/` | Environment variables, CORS configuration |
| `src/plugins/` | Fastify plugins for Prisma, Redis, authentication |
| `src/middleware/` | Rate limiting, audit logging, authentication checks |
| `src/services/` | Business logic for auth, email, MFA, OAuth, organizations, webhooks |
| `src/routes/` | API endpoint definitions |
| `src/utils/` | Cryptography (Argon2, AES), token generation, HIBP integration |
| `src/prisma/` | Database schema and migrations |

**Services:**

| Service | Responsibilities |
|---------|------------------|
| `auth.service.ts` | Sign-up, sign-in, sign-out, token refresh, password reset, email verification |
| `mfa.service.ts` | TOTP setup/verification, backup codes |
| `oauth.service.ts` | OAuth flow handling for all providers |
| `user.service.ts` | User CRUD, profile updates, metadata |
| `organization.service.ts` | Organization management, memberships, roles, invitations |
| `email.service.ts` | Email sending via Resend |
| `webhook.service.ts` | Webhook delivery, retry logic |
| `admin.service.ts` | Admin-only operations, statistics |

**API Endpoints:**

```
POST   /api/v1/auth/sign-up
POST   /api/v1/auth/sign-in
POST   /api/v1/auth/sign-out
POST   /api/v1/auth/refresh
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
POST   /api/v1/auth/email/verify
POST   /api/v1/auth/mfa/setup
POST   /api/v1/auth/mfa/verify
GET    /api/v1/auth/oauth/:provider
GET    /api/v1/auth/oauth/:provider/callback

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:id

GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id
DELETE /api/v1/organizations/:id

GET    /api/v1/admin/users
GET    /api/v1/admin/stats
GET    /api/v1/admin/audit-logs
...
```

---

### 3. @bastionauth/react

**Location:** `packages/react/`

React SDK providing context, hooks, and pre-built UI components.

**Exports:**

| Export | Type | Description |
|--------|------|-------------|
| `BastionProvider` | Component | Context provider — wrap your app with this |
| `useAuth` | Hook | Access `isSignedIn`, `userId`, `signOut`, `getToken` |
| `useUser` | Hook | Access current user data and update functions |
| `useSession` | Hook | Access session information |
| `useOrganization` | Hook | Access active organization |
| `useOrganizationList` | Hook | List user's organizations |
| `useSignIn` | Hook | Programmatic sign-in control |
| `useSignUp` | Hook | Programmatic sign-up control |
| `SignIn` | Component | Pre-built sign-in form |
| `SignUp` | Component | Pre-built sign-up form |
| `UserButton` | Component | User avatar with dropdown menu |
| `ProtectedRoute` | Component | Route wrapper requiring authentication |
| `RedirectToSignIn` | Component | Automatic redirect when not authenticated |

**Usage Example:**

```tsx
import { BastionProvider, SignIn, useAuth } from '@bastionauth/react';

function App() {
  return (
    <BastionProvider publishableKey="pk_live_...">
      <MyApp />
    </BastionProvider>
  );
}

function Dashboard() {
  const { isSignedIn, user, signOut } = useAuth();
  
  if (!isSignedIn) {
    return <SignIn />;
  }
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

---

### 4. @bastionauth/nextjs

**Location:** `packages/nextjs/`

Next.js-specific integration providing edge middleware and server helpers.

**Key Features:**

1. **Edge Middleware** — Protect routes at the edge before they render

```typescript
// middleware.ts
import { authMiddleware } from '@bastionauth/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  signInUrl: '/sign-in',
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

2. **Server Helpers** — Access auth state in Server Components

```typescript
// app/dashboard/page.tsx
import { auth, currentUser } from '@bastionauth/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  
  return <h1>Hello, {user?.firstName}!</h1>;
}
```

3. **Re-exports** — All React SDK components available from `@bastionauth/nextjs`

---

### 5. @bastionauth/admin

**Location:** `packages/admin/`

Full-featured admin dashboard built with Next.js 14 App Router.

**Features:**

| Page | Functionality |
|------|---------------|
| Dashboard | Overview statistics, recent activity, quick actions |
| Users | List all users, search, filter, view details, ban/unban |
| Organizations | Manage organizations, view members, edit settings |
| Sessions | View active sessions, revoke sessions |
| Audit Logs | Security audit trail with filtering |
| Webhooks | Configure webhook endpoints, view delivery status |
| API Keys | Create and manage server-to-server API keys |
| Settings | Configure authentication settings |

---

## Database Schema

The Prisma schema defines 15 models for complete authentication functionality:

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | email, passwordHash, firstName, lastName, mfaEnabled, mfaSecret |
| `Session` | Active sessions | userId, refreshTokenHash, ipAddress, userAgent, expiresAt |
| `OAuthAccount` | Linked OAuth | userId, provider, providerAccountId, accessToken |

### Organization Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Organization` | Multi-tenant orgs | name, slug, imageUrl, maxMembers, allowedDomains |
| `OrganizationMembership` | User-org relationship | userId, organizationId, role, permissions |
| `OrganizationRole` | Custom roles | name, key, permissions, isDefault |
| `OrganizationInvitation` | Pending invites | email, token, status, expiresAt |

### Token Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `EmailVerificationToken` | Email verification | userId, token, expiresAt, usedAt |
| `PasswordResetToken` | Password reset | userId, tokenHash, expiresAt, usedAt |
| `MagicLink` | Passwordless login | email, tokenHash, expiresAt, redirectUrl |
| `Passkey` | WebAuthn | userId, credentialId, publicKey, counter |

### System Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `AuditLog` | Security audit | userId, action, ipAddress, metadata, status |
| `Webhook` | Webhook config | url, secret, events, enabled |
| `WebhookDelivery` | Delivery tracking | webhookId, eventType, payload, statusCode, attempts |
| `ApiKey` | Server auth | name, keyHash, scopes, expiresAt |

---

## Authentication Flows

### Email/Password Sign-In Flow

```
1. Client submits email + password
2. Server validates credentials (Argon2id)
3. If MFA enabled:
   a. Create MFA challenge in Redis
   b. Return { requiresMfa: true, challengeId }
   c. Client submits TOTP code
   d. Server validates code
4. Generate tokens:
   - Access token (RS256 JWT, 15min expiry)
   - Refresh token (opaque, 7-day expiry)
5. Create session in database
6. Return { user, accessToken, refreshToken }
```

### Token Refresh Flow

```
1. Client sends refresh token
2. Server hashes token and looks up session
3. Validate session is active and not expired
4. Generate new access + refresh tokens (rotation)
5. Update session with new refresh token hash
6. Return new token pair
```

### OAuth Flow

```
1. Client redirects to /auth/oauth/:provider
2. Server generates state + PKCE code verifier
3. Redirect to OAuth provider authorization page
4. User authorizes application
5. Provider redirects to callback with code
6. Server exchanges code for tokens
7. Fetch user profile from provider
8. Create/link OAuth account
9. Create session and redirect to app
```

---

## Security Implementation

### Password Security

| Aspect | Implementation |
|--------|----------------|
| **Hashing Algorithm** | Argon2id |
| **Memory Cost** | 64 MB |
| **Time Cost** | 3 iterations |
| **Parallelism** | 4 threads |
| **Salt** | Random 16 bytes per password |
| **Breach Detection** | HaveIBeenPwned k-anonymity API |

### Token Security

| Token Type | Algorithm | Expiry | Storage |
|------------|-----------|--------|---------|
| Access Token | RS256 (4096-bit) | 15 minutes | Client memory/cookie |
| Refresh Token | Opaque + SHA256 | 7 days | Database (hashed only) |
| API Key | Random + SHA256 | Configurable | Database (hashed only) |
| MFA Challenge | UUID | 5 minutes | Redis |

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/sign-in` | 5 requests | 60 seconds |
| `POST /auth/sign-up` | 3 requests | 60 seconds |
| `POST /auth/refresh` | 10 requests | 60 seconds |
| `POST /auth/password/forgot` | 3 requests | 60 seconds |
| `GET /api/*` | 100 requests | 60 seconds |
| `POST /api/*` | 50 requests | 60 seconds |

Implementation: Sliding window using Redis sorted sets.

### MFA Security

- TOTP secrets encrypted with AES-256-GCM before storage
- Backup codes (8 codes, 10 chars each) encrypted individually
- Challenge attempts limited (max 5 per challenge)
- Challenge expiry: 5 minutes

---

## Current Implementation Status

### Completed Features ✅

- [x] **Monorepo Setup** — pnpm workspace with Turborepo
- [x] **Docker Configuration** — PostgreSQL 15 + Redis 7
- [x] **Core Package** — Types, constants, validation utilities
- [x] **Server Package** — Complete Fastify API
- [x] **Authentication** — Sign-up, sign-in, sign-out, token refresh
- [x] **Password Reset** — Request and reset with secure tokens
- [x] **Email Verification** — Token-based email verification
- [x] **Magic Links** — Passwordless authentication option
- [x] **MFA** — TOTP setup/verification with backup codes
- [x] **OAuth** — Google, GitHub, Microsoft, Apple, LinkedIn
- [x] **Organizations** — Create, manage, memberships, roles
- [x] **RBAC** — Role-based access control with permissions
- [x] **Invitations** — Invite users to organizations
- [x] **Webhooks** — Event delivery with retry logic
- [x] **Admin API** — Statistics, user management, audit logs
- [x] **API Keys** — Server-to-server authentication
- [x] **React SDK** — Provider, hooks, components
- [x] **Next.js Integration** — Middleware, server helpers
- [x] **Admin Dashboard** — Full management UI
- [x] **Example App** — Working Next.js integration
- [x] **Unit Tests** — Vitest test suite
- [x] **E2E Tests** — Playwright test suite

---

## Next Steps

### Immediate Actions (Production Readiness)

1. **End-to-End Testing**
   - Run `pnpm dev` to start all services
   - Test complete authentication flows in browser
   - Verify OAuth providers work correctly
   - Test MFA setup and verification

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Configure all required environment variables
   - Set up production database connection
   - Configure Resend API key for emails

3. **Security Setup**
   - Run `./scripts/generate-keys.sh` for RS256 key pair
   - Configure strong `JWT_SECRET` and `ENCRYPTION_KEY`
   - Set up proper CORS origins for production

4. **Database Migration**
   - Run `pnpm db:migrate` to apply schema
   - Optionally run `pnpm db:seed` for test data

### Short-Term Enhancements

1. **CI/CD Pipeline**
   - GitHub Actions workflow for testing
   - Automated builds on push
   - Deployment automation

2. **npm Publishing**
   - Publish `@bastionauth/core` to npm
   - Publish `@bastionauth/react` to npm
   - Publish `@bastionauth/nextjs` to npm
   - Set up semantic versioning

3. **Documentation Site**
   - Build bastionauth.dev with Docusaurus/Nextra
   - API reference documentation
   - Integration guides
   - Video tutorials

4. **Custom Email Templates**
   - Allow HTML template customization
   - Support for multiple languages
   - Preview functionality in admin

### Future Roadmap

- [ ] **SAML SSO Support** — Enterprise single sign-on
- [ ] **Passwordless Authentication** — Email-only login (no password)
- [ ] **User Impersonation** — Admin can act as any user
- [ ] **IP Allowlisting** — Restrict access by IP
- [ ] **Session Fingerprinting** — Enhanced security
- [ ] **Audit Log Export** — CSV/JSON export
- [ ] **Kubernetes Helm Chart** — K8s deployment
- [ ] **Custom OAuth Providers** — Add any OAuth2 provider
- [ ] **Social Login Buttons** — Pre-styled OAuth buttons
- [ ] **Passkey Support** — Full WebAuthn implementation

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
pnpm docker:up

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database with test data (optional)
pnpm db:seed

# Start all services in development
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build all packages
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format

# Open Prisma Studio (database GUI)
pnpm db:studio

# Stop Docker containers
pnpm docker:down
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [`packages/server/src/services/auth.service.ts`](../packages/server/src/services/auth.service.ts) | Core authentication logic |
| [`packages/server/src/prisma/schema.prisma`](../packages/server/src/prisma/schema.prisma) | Complete database schema |
| [`packages/server/src/utils/crypto.ts`](../packages/server/src/utils/crypto.ts) | Password hashing, encryption |
| [`packages/server/src/utils/tokens.ts`](../packages/server/src/utils/tokens.ts) | JWT generation, token utilities |
| [`packages/react/src/context/BastionProvider.tsx`](../packages/react/src/context/BastionProvider.tsx) | React context provider |
| [`packages/react/src/hooks/useAuth.ts`](../packages/react/src/hooks/useAuth.ts) | Main auth hook |
| [`packages/nextjs/src/middleware.ts`](../packages/nextjs/src/middleware.ts) | Next.js edge middleware |
| [`packages/nextjs/src/server.ts`](../packages/nextjs/src/server.ts) | Server-side helpers |
| [`packages/admin/src/app/page.tsx`](../packages/admin/src/app/page.tsx) | Admin dashboard home |
| [`apps/example-nextjs/src/middleware.ts`](../apps/example-nextjs/src/middleware.ts) | Example middleware usage |
| [`docker/docker-compose.yml`](../docker/docker-compose.yml) | Docker infrastructure |
| [`env.example`](../env.example) | Environment variable template |

---

## Environment Variables

Key environment variables required:

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bastionauth

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_PRIVATE_KEY=<RS256 private key>
JWT_PUBLIC_KEY=<RS256 public key>
ENCRYPTION_KEY=<32-byte hex key for AES-256>

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# ... other providers

# URLs
API_URL=http://localhost:3001
APP_URL=http://localhost:3000
```

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on:
- Setting up development environment
- Code style and conventions
- Submitting pull requests
- Running tests

---

## License

MIT © BastionAuth

