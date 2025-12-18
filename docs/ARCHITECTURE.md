# BastionAuth Architecture

> Authentication, fortified.

This document provides a comprehensive overview of BastionAuth's architecture, design decisions, and system flows.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Package Structure](#package-structure)
4. [Authentication Flows](#authentication-flows)
5. [Security Architecture](#security-architecture)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Technology Stack](#technology-stack)

---

## System Overview

BastionAuth is a complete, self-hostable enterprise authentication system designed for:

- **Security First**: Enterprise-grade security with Argon2id, RS256 JWT, and breach detection
- **Developer Experience**: Beautiful SDKs for React and Next.js
- **Scalability**: Stateless architecture with Redis for sessions and rate limiting
- **Flexibility**: OAuth, MFA, magic links, passkeys, and organizations

---

## Architecture Diagram

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

---

## JWT Authentication Flow

```
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│  Client  │                  │   API    │                  │ Database │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                             │                             │
     │  1. POST /auth/sign-in      │                             │
     │  {email, password}          │                             │
     ├────────────────────────────►│                             │
     │                             │  2. Fetch user              │
     │                             ├────────────────────────────►│
     │                             │◄────────────────────────────┤
     │                             │                             │
     │                             │  3. Verify password         │
     │                             │     (Argon2id)              │
     │                             │                             │
     │                             │  4. Generate tokens         │
     │                             │     • Access (RS256, 15min) │
     │                             │     • Refresh (opaque, 7d)  │
     │                             │                             │
     │                             │  5. Store session           │
     │                             ├────────────────────────────►│
     │                             │◄────────────────────────────┤
     │                             │                             │
     │  6. Return tokens           │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │  7. API Request             │                             │
     │  Authorization: Bearer xxx  │                             │
     ├────────────────────────────►│                             │
     │                             │                             │
     │                             │  8. Verify JWT (RS256)      │
     │                             │     Check expiry            │
     │                             │                             │
     │  9. Response                │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
     │  ─ ─ ─ Token Expired ─ ─ ─  │                             │
     │                             │                             │
     │  10. POST /auth/refresh     │                             │
     │  {refreshToken}             │                             │
     ├────────────────────────────►│                             │
     │                             │  11. Validate refresh token │
     │                             ├────────────────────────────►│
     │                             │◄────────────────────────────┤
     │                             │                             │
     │                             │  12. Rotate refresh token   │
     │                             │      Issue new access token │
     │                             │                             │
     │  13. New tokens             │                             │
     │◄────────────────────────────┤                             │
     │                             │                             │
```

---

## Webhook Delivery Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────────┐
│  Event   │      │  Queue   │      │ Delivery │      │   Client     │
│ Trigger  │      │ (Redis)  │      │  Worker  │      │   Webhook    │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └──────┬───────┘
     │                 │                 │                   │
     │  1. Event       │                 │                   │
     │  (user.created) │                 │                   │
     ├────────────────►│                 │                   │
     │                 │                 │                   │
     │                 │  2. Dequeue     │                   │
     │                 ├────────────────►│                   │
     │                 │                 │                   │
     │                 │                 │  3. Sign payload  │
     │                 │                 │  (HMAC-SHA256)    │
     │                 │                 │                   │
     │                 │                 │  4. POST webhook  │
     │                 │                 ├──────────────────►│
     │                 │                 │                   │
     │                 │                 │  5. Response      │
     │                 │                 │◄──────────────────┤
     │                 │                 │                   │
     │                 │                 │  6. Log delivery  │
     │                 │                 │  (success/fail)   │
     │                 │                 │                   │
     │                 │  7. Retry if    │                   │
     │                 │     failed      │                   │
     │                 │◄────────────────┤                   │
     │                 │                 │                   │
```

---

## Package Structure

```
bastionauth/
├── packages/
│   ├── core/                 # Shared code
│   │   ├── src/
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   ├── constants/    # Error codes, events, config
│   │   │   └── utils/        # Validation, helpers
│   │   └── package.json
│   │
│   ├── server/               # API Server
│   │   ├── src/
│   │   │   ├── config/       # Environment, CORS
│   │   │   ├── plugins/      # Prisma, Redis, auth
│   │   │   ├── middleware/   # Rate limit, audit
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── utils/        # Crypto, tokens
│   │   │   └── prisma/       # Schema, migrations
│   │   └── package.json
│   │
│   ├── react/                # React SDK
│   │   ├── src/
│   │   │   ├── context/      # BastionProvider
│   │   │   ├── hooks/        # useAuth, useUser, etc.
│   │   │   ├── components/   # SignIn, SignUp, UserButton
│   │   │   └── api/          # API client
│   │   └── package.json
│   │
│   ├── nextjs/               # Next.js Integration
│   │   ├── src/
│   │   │   ├── middleware.ts # Edge middleware
│   │   │   ├── server.ts     # Server helpers
│   │   │   └── client.ts     # Client helpers
│   │   └── package.json
│   │
│   └── admin/                # Admin Dashboard
│       ├── src/
│       │   ├── app/          # Next.js 14 App Router
│       │   └── components/   # Dashboard components
│       └── package.json
│
├── apps/
│   └── example-nextjs/       # Example integration
│
├── docs/                     # Documentation
│   ├── api/                  # API reference
│   └── guides/               # User guides
│
├── e2e/                      # Playwright E2E tests
├── docker/                   # Docker configuration
└── scripts/                  # Utility scripts
```

---

## Security Architecture

### Password Security

```
┌─────────────────────────────────────────────────────────────┐
│                    Password Flow                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   User Input         Validation          Breach Check       │
│   ──────────    ─────────────────    ─────────────────     │
│   "password"    • Min 8 chars        HaveIBeenPwned API    │
│                 • Uppercase          (k-anonymity)          │
│                 • Lowercase                                  │
│                 • Number                                     │
│                        │                    │                │
│                        ▼                    ▼                │
│                 ┌─────────────────────────────────┐         │
│                 │         Argon2id Hash           │         │
│                 │                                 │         │
│                 │  Memory: 64MB                   │         │
│                 │  Iterations: 3                  │         │
│                 │  Parallelism: 4                 │         │
│                 │  Salt: Random 16 bytes          │         │
│                 └─────────────────────────────────┘         │
│                                │                             │
│                                ▼                             │
│                 ┌─────────────────────────────────┐         │
│                 │      Store in Database          │         │
│                 │  $argon2id$v=19$m=65536...      │         │
│                 └─────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Token Security

| Token Type | Algorithm | Expiry | Storage |
|------------|-----------|--------|---------|
| Access Token | RS256 (JWT) | 15 minutes | Memory/Cookie |
| Refresh Token | Opaque + SHA256 | 7 days | Database (hashed) |
| API Key | Random + SHA256 | Configurable | Database (hashed) |
| MFA Token | Random | 5 minutes | Redis |

### Rate Limiting

```
┌─────────────────────────────────────────────────────────────┐
│                Sliding Window Rate Limiter                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Endpoint              Limit          Window               │
│   ────────────────────────────────────────────              │
│   POST /auth/sign-in    5 requests     60 seconds           │
│   POST /auth/sign-up    3 requests     60 seconds           │
│   POST /auth/refresh    10 requests    60 seconds           │
│   GET  /api/*           100 requests   60 seconds           │
│   POST /api/*           50 requests    60 seconds           │
│                                                             │
│   ┌─────────────────────────────────────────────────┐       │
│   │                   Redis                          │       │
│   │                                                  │       │
│   │   rate:192.168.1.1:/auth/sign-in                │       │
│   │   ├── timestamp:1705320000 → 1                  │       │
│   │   ├── timestamp:1705320015 → 1                  │       │
│   │   └── timestamp:1705320030 → 1                  │       │
│   │                                                  │       │
│   │   Cleanup: ZREMRANGEBYSCORE (older than window) │       │
│   └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Models

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │     Session     │     │  OAuthAccount   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────┤ userId          │     │ id              │
│ email           │     │ refreshToken    │     │ userId          │────►
│ passwordHash    │     │ userAgent       │     │ provider        │
│ firstName       │     │ ipAddress       │     │ providerAcctId  │
│ lastName        │     │ expiresAt       │     │ accessToken     │
│ imageUrl        │     │ createdAt       │     │ refreshToken    │
│ emailVerified   │     └─────────────────┘     └─────────────────┘
│ mfaEnabled      │
│ totpSecret      │     ┌─────────────────┐
│ backupCodes     │     │   Organization  │
│ suspendedAt     │     ├─────────────────┤
│ createdAt       │     │ id              │
│ updatedAt       │     │ name            │◄────────────────┐
└────────┬────────┘     │ slug            │                 │
         │              │ logoUrl         │     ┌───────────┴───────┐
         │              │ createdAt       │     │  OrgMembership    │
         │              └─────────────────┘     ├───────────────────┤
         │                                      │ id                │
         └──────────────────────────────────────┤ userId            │
                                                │ organizationId    │
                                                │ roleId            │
                                                └───────────────────┘
```

### Supporting Models

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    AuditLog     │     │     Webhook     │     │     ApiKey      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ userId          │     │ url             │     │ name            │
│ action          │     │ events[]        │     │ keyHash         │
│ ipAddress       │     │ secret          │     │ keyPrefix       │
│ userAgent       │     │ isActive        │     │ scopes[]        │
│ metadata        │     │ createdAt       │     │ expiresAt       │
│ createdAt       │     └────────┬────────┘     │ lastUsedAt      │
└─────────────────┘              │              │ createdAt       │
                                 │              └─────────────────┘
                    ┌────────────▼────────────┐
                    │   WebhookDelivery       │
                    ├─────────────────────────┤
                    │ id                      │
                    │ webhookId               │
                    │ event                   │
                    │ payload                 │
                    │ status                  │
                    │ statusCode              │
                    │ attempts                │
                    │ createdAt               │
                    └─────────────────────────┘
```

---

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Framework | Fastify 4.x | Web framework |
| Database | PostgreSQL 15+ | Primary data store |
| ORM | Prisma | Database access |
| Cache | Redis 7+ | Sessions, rate limiting |
| Email | Resend | Transactional email |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18+ | UI library |
| Meta-Framework | Next.js 14 | Full-stack React |
| Styling | CSS Variables | Theming |
| UI Kit | @mawtech/glass-ui | Component library |

### Security

| Feature | Implementation |
|---------|----------------|
| Password Hashing | Argon2id (64MB, 3 iter) |
| JWT Signing | RS256 (4096-bit keys) |
| Encryption | AES-256-GCM |
| MFA | TOTP (RFC 6238) |
| Passkeys | WebAuthn |

### DevOps

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Turborepo | Monorepo build system |
| pnpm | Package manager |
| Vitest | Unit testing |
| Playwright | E2E testing |

---

## Design Principles

1. **Security First**: Every decision prioritizes security
2. **Developer Experience**: Simple APIs, great documentation
3. **Self-Hostable**: Run anywhere with Docker
4. **Extensible**: Easy to add providers and features
5. **Type-Safe**: Full TypeScript coverage

---

## Future Roadmap

- [ ] SAML SSO support
- [ ] Passwordless authentication
- [ ] Custom email templates
- [ ] Audit log export
- [ ] User impersonation
- [ ] IP allowlisting
- [ ] Session fingerprinting
- [ ] Kubernetes Helm chart

