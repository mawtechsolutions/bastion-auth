# BastionAuth Master Onboarding Document

> **Welcome to the team!** This document will help you understand BastionAuth from the ground up. Whether you're a developer, DevOps engineer, QA tester, or project manager, you'll find everything you need here.

---

## Table of Contents

1. [Introduction - What is BastionAuth?](#1-introduction---what-is-bastionauth)
2. [Architecture (Principal Engineer Perspective)](#2-architecture-principal-engineer-perspective)
3. [Infrastructure (DevOps Perspective)](#3-infrastructure-devops-perspective)
4. [Quality Assurance (QA Perspective)](#4-quality-assurance-qa-perspective)
5. [Workflow (Team Lead/PM Perspective)](#5-workflow-team-leadpm-perspective)
6. [Quick Reference](#6-quick-reference)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Glossary](#8-glossary)

---

## 1. Introduction - What is BastionAuth?

### The Simple Explanation

**BastionAuth is like a security guard for your applications.**

When users want to access your app, BastionAuth:
1. **Checks their identity** (email + password, or social login)
2. **Gives them a badge** (a secure token)
3. **Remembers who they are** (sessions)
4. **Controls what they can do** (permissions)

### Why "Bastion"?

A bastion is a fortified structure - the strongest part of a castle's defenses. We chose this name because authentication is the most critical security layer of any application. If authentication fails, everything else is vulnerable.

### What Problems Does BastionAuth Solve?

| Problem | BastionAuth Solution |
|---------|---------------------|
| "I need secure login for my app" | Production-ready auth API |
| "I don't want to build auth from scratch" | Pre-built React/Next.js components |
| "I need OAuth (Google, GitHub, etc.)" | Built-in OAuth provider support |
| "I need MFA/2FA" | TOTP-based two-factor authentication |
| "I need to manage organizations/teams" | Full organization & role management |
| "I want to host it myself" | 100% self-hostable with Docker |

### Who Uses BastionAuth?

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR APPLICATION                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  React App   │  │ Next.js App  │  │ Mobile App   │          │
│  │  (Frontend)  │  │  (Fullstack) │  │   (Future)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│              ┌────────────────────────┐                         │
│              │      BastionAuth       │                         │
│              │    (Authentication)    │                         │
│              └────────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture (Principal Engineer Perspective)

This section explains **why** we chose this technology stack and **how** the system works under the hood.

### 2.1 Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND                    BACKEND                             │
│  ─────────                   ───────                             │
│  • React 18+                 • Node.js 20+                       │
│  • Next.js 14                • Fastify 4.x                       │
│  • TypeScript                • Prisma ORM                        │
│                              • TypeScript                        │
│                                                                  │
│  DATABASES                   SECURITY                            │
│  ─────────                   ────────                            │
│  • PostgreSQL 15+            • Argon2id (passwords)              │
│  • Redis 7+                  • RS256 JWT (tokens)                │
│                              • AES-256-GCM (encryption)          │
│                              • TOTP (MFA)                        │
│                                                                  │
│  DEVOPS                      TESTING                             │
│  ──────                      ───────                             │
│  • Docker                    • Vitest (unit)                     │
│  • GitHub Actions            • Playwright (E2E)                  │
│  • Turborepo                 • k6 (load)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Fastify? (Not Express)

You might be wondering: "Why not use Express? Everyone uses Express!"

Here's the comparison:

| Feature | Express | Fastify (Our Choice) |
|---------|---------|---------------------|
| **Requests/second** | ~10,000 | ~30,000 (3x faster!) |
| **Validation** | Manual or middleware | Built-in JSON Schema |
| **TypeScript** | Needs configuration | First-class support |
| **Plugin system** | Middleware chain | Encapsulated plugins |
| **Async/await** | Manual error handling | Native support |

**Real-world analogy:**
- Express is like a **Swiss Army knife** - general purpose, fits most needs
- Fastify is like a **surgical scalpel** - specialized for APIs, precise and fast

**When does speed matter?**

```
Express (10,000 req/sec):
├── User 1: 0.1ms ✓
├── User 2: 0.1ms ✓
├── User 10,001: ⏳ WAITING
└── Under heavy load: SLOW

Fastify (30,000 req/sec):
├── User 1: 0.03ms ✓
├── User 2: 0.03ms ✓
├── User 30,001: ⏳ WAITING
└── Can handle 3x more users before slowing down
```

### 2.3 Why PostgreSQL? (Not MongoDB)

**The short answer:** Authentication data is inherently relational.

**What does "relational" mean?**

Think about how our data connects:
- A **User** belongs to many **Organizations**
- An **Organization** has many **Members**
- A **Member** has a **Role**
- A **Role** has **Permissions**

This is like a family tree - relationships everywhere!

```
PostgreSQL (Relational - Our Choice):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   User ────────────┬──────────────── Organization          │
│    │               │                      │                │
│    │         OrganizationMembership       │                │
│    │               │                      │                │
│    └───────────────┴──────────────────────┘                │
│                    │                                        │
│                   Role                                      │
│                    │                                        │
│              Permissions[]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

MongoDB (Document - Not ideal for auth):
┌─────────────────────────────────────────────────────────────┐
│  {                                                          │
│    user: {                                                  │
│      organizations: [                                       │
│        { name: "...", role: "...", permissions: [...] }    │
│      ]                                                      │
│    }                                                        │
│  }                                                          │
│                                                             │
│  Problem: If organization name changes, update EVERY user! │
└─────────────────────────────────────────────────────────────┘
```

**Why PostgreSQL specifically?**

1. **ACID Compliance** - Bank-level reliability
   - A = Atomicity: Operations complete fully or not at all
   - C = Consistency: Data always valid
   - I = Isolation: Concurrent operations don't interfere
   - D = Durability: Committed data survives crashes

2. **Prisma ORM** - Type-safe database queries
   ```typescript
   // TypeScript catches bugs BEFORE runtime!
   const user = await prisma.user.findUnique({
     where: { email: 'test@example.com' },
     include: { sessions: true }
   });
   // user.sessions is typed as Session[] - no guessing!
   ```

### 2.4 Why Redis? (Can't PostgreSQL Do Everything?)

**Short answer:** Speed. Redis is ~100x faster for certain operations.

**What is Redis?**

Redis is an "in-memory" database. Think of it like this:

```
PostgreSQL (Disk-based):
┌─────────────────────────────────────────────────────────────┐
│  Request → Query → Read from DISK → Process → Response      │
│                         ↑                                    │
│                    SLOW (~50ms)                              │
│                    (like reading a book from the library)    │
└─────────────────────────────────────────────────────────────┘

Redis (Memory-based):
┌─────────────────────────────────────────────────────────────┐
│  Request → Check memory → Response                          │
│                 ↑                                            │
│            FAST (~1ms)                                       │
│            (like remembering something in your head)         │
└─────────────────────────────────────────────────────────────┘
```

**What do we store in Redis?**

| Data | Why Redis? | Example |
|------|-----------|---------|
| **Sessions** | Checked on EVERY request | "Is user abc123 logged in?" |
| **Rate limits** | Many writes per second | "IP 1.2.3.4 made 5 requests" |
| **Temp tokens** | Short-lived, high access | MFA codes, magic links |
| **Cache** | Reduce database load | User profile, permissions |

**Real-world flow:**

```
User makes request with token
         │
         ▼
┌─────────────────┐
│ Check Redis     │ ←── FAST (1ms)
│ "Is token valid?"│
└────────┬────────┘
         │
    Found in Redis?
    ┌────┴────┐
   YES       NO
    │         │
    ▼         ▼
  Allow    ┌─────────────────┐
  request  │ Check PostgreSQL │ ←── Slower (50ms)
           │ "Find user..."   │
           └────────┬────────┘
                    │
                    ▼
              Cache in Redis
              for next time
```

### 2.5 Monorepo Structure Explained

**What is a monorepo?**

A monorepo is a single repository containing multiple related projects. Think of it like a apartment building - separate units, but shared infrastructure.

```
bastionauth/                    
├── packages/                    # NPM packages (published to npm)
│   │
│   ├── core/                    # @bastionauth/core
│   │   │                        # ────────────────
│   │   │                        # Shared code used by ALL other packages
│   │   │                        # 
│   │   ├── src/
│   │   │   ├── types/           # TypeScript interfaces
│   │   │   │   └── user.ts      # "What is a User object?"
│   │   │   ├── constants/       # Error codes, event names
│   │   │   │   └── errors.ts    # ERROR_CODES.INVALID_EMAIL
│   │   │   └── utils/           # Validation, helpers
│   │   │       └── validate.ts  # isValidEmail(), isStrongPassword()
│   │   └── package.json
│   │
│   ├── server/                  # @bastionauth/server
│   │   │                        # ─────────────────
│   │   │                        # The API backend (this is the "brain")
│   │   │
│   │   ├── src/
│   │   │   ├── routes/          # API endpoints
│   │   │   │   ├── auth.ts      # POST /auth/sign-in, /auth/sign-up
│   │   │   │   ├── users.ts     # GET /users/me, PATCH /users/me
│   │   │   │   └── admin.ts     # Admin-only endpoints
│   │   │   │
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── auth.service.ts    # signIn(), signUp(), refresh()
│   │   │   │   ├── user.service.ts    # getUser(), updateUser()
│   │   │   │   └── mfa.service.ts     # enableMFA(), verifyMFA()
│   │   │   │
│   │   │   ├── middleware/      # Request interceptors
│   │   │   │   ├── authenticate.ts    # Check JWT token
│   │   │   │   └── rate-limit.ts      # Prevent abuse
│   │   │   │
│   │   │   ├── utils/           # Helper functions
│   │   │   │   ├── crypto.ts    # encrypt(), decrypt()
│   │   │   │   ├── tokens.ts    # generateJWT(), verifyJWT()
│   │   │   │   └── password.ts  # hashPassword(), verifyPassword()
│   │   │   │
│   │   │   └── prisma/          # Database
│   │   │       ├── schema.prisma     # Database schema
│   │   │       ├── migrations/       # Database changes over time
│   │   │       └── seed.ts           # Create test data
│   │   │
│   │   ├── tests/               # Unit tests
│   │   └── package.json
│   │
│   ├── react/                   # @bastionauth/react
│   │   │                        # ────────────────
│   │   │                        # React hooks and components
│   │   │
│   │   ├── src/
│   │   │   ├── context/         
│   │   │   │   └── BastionProvider.tsx   # <BastionProvider> wrapper
│   │   │   │
│   │   │   ├── hooks/           
│   │   │   │   ├── useAuth.ts   # const { signIn, signOut } = useAuth()
│   │   │   │   ├── useUser.ts   # const { user, isLoaded } = useUser()
│   │   │   │   └── useSession.ts
│   │   │   │
│   │   │   └── components/      
│   │   │       ├── SignIn/      # <SignIn /> - Ready-to-use sign in form
│   │   │       ├── SignUp/      # <SignUp /> - Ready-to-use sign up form
│   │   │       └── UserButton/  # <UserButton /> - User avatar dropdown
│   │   │
│   │   └── package.json
│   │
│   ├── nextjs/                  # @bastionauth/nextjs
│   │   │                        # ─────────────────
│   │   │                        # Next.js specific features
│   │   │
│   │   ├── src/
│   │   │   ├── middleware.ts    # Protect routes at the edge
│   │   │   ├── server.ts        # Server-side helpers
│   │   │   └── client.ts        # Client-side helpers
│   │   │
│   │   └── package.json
│   │
│   └── admin/                   # Admin Dashboard
│       │                        # ───────────────
│       │                        # For managing users, viewing logs
│       │
│       ├── src/
│       │   └── app/             # Next.js 14 App Router
│       │       ├── dashboard/   # Main dashboard
│       │       ├── users/       # User management
│       │       ├── logs/        # Audit logs
│       │       └── settings/    # Configuration
│       │
│       └── package.json
│
├── apps/                        # Example applications
│   │
│   └── example-nextjs/          # Demo app showing BastionAuth in action
│       ├── src/
│       │   └── app/
│       │       ├── page.tsx         # Home page
│       │       ├── sign-in/         # Sign in page
│       │       ├── sign-up/         # Sign up page
│       │       ├── dashboard/       # Protected dashboard
│       │       └── organizations/   # Org management
│       │
│       └── package.json
│
├── e2e/                         # End-to-end tests (Playwright)
│   ├── auth-flow.spec.ts        # Test sign up, sign in, sign out
│   ├── organizations.spec.ts    # Test org creation, membership
│   └── api/                     # API contract tests
│       ├── auth.api.spec.ts
│       └── users.api.spec.ts
│
├── tests/                       # Performance tests
│   └── load/
│       └── auth-load.js         # k6 load testing script
│
├── docker/                      # Docker configuration
│   ├── docker-compose.yml       # Development containers
│   ├── docker-compose.prod.yml  # Production containers
│   └── docker-compose.dev.yml   # Development overrides
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # System architecture
│   ├── API.md                   # API reference
│   └── ONBOARDING.md            # This file!
│
└── scripts/                     # Utility scripts
    └── generate-keys.sh         # Generate JWT keys
```

### 2.6 Data Flow: What Happens When You Log In?

Let's trace through a complete login flow step by step:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGN-IN FLOW (Step by Step)                  │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User submits login form
─────────────────────────────────
┌──────────────┐
│   Browser    │
│              │
│  Email: ██   │  ──────►  POST /auth/sign-in
│  Pass:  ██   │           { email, password }
│  [Sign In]   │
└──────────────┘


STEP 2: Rate limit check (Redis)
─────────────────────────────────
┌──────────────┐     ┌──────────────┐
│    Server    │────►│    Redis     │
│              │     │              │
│  "Can this   │     │  rate:1.2.3.4│
│   IP login?" │◄────│  count: 3    │
│              │     │  (limit: 5)  │
└──────────────┘     └──────────────┘

  ✓ Under limit → Continue
  ✗ Over limit → Return 429 (Too Many Requests)


STEP 3: Find user in database
─────────────────────────────────
┌──────────────┐     ┌──────────────┐
│    Server    │────►│  PostgreSQL  │
│              │     │              │
│  SELECT *    │     │   Users      │
│  FROM users  │◄────│  ┌────────┐  │
│  WHERE       │     │  │ email  │  │
│  email = ?   │     │  │ hash   │  │
│              │     │  │ ...    │  │
└──────────────┘     └──────────────┘

  ✓ Found → Continue
  ✗ Not found → Return 401 (Invalid credentials)
                (Same message as wrong password to prevent enumeration)


STEP 4: Verify password
─────────────────────────────────
┌──────────────────────────────────────────────────┐
│                                                  │
│  User entered: "MySecurePassword123!"            │
│                       │                          │
│                       ▼                          │
│  ┌─────────────────────────────────────────┐    │
│  │            Argon2id Verify               │    │
│  │                                          │    │
│  │  Input: "MySecurePassword123!"           │    │
│  │  Stored: "$argon2id$v=19$m=65536..."     │    │
│  │                                          │    │
│  │  Result: MATCH ✓                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘

  ✓ Match → Continue
  ✗ No match → Return 401, increment failed attempts


STEP 5: Check if MFA is enabled
─────────────────────────────────
┌──────────────────────────────────────────────────┐
│                                                  │
│  if (user.mfaEnabled) {                          │
│    // Don't give tokens yet!                     │
│    return {                                      │
│      mfaRequired: true,                          │
│      mfaToken: "temp-token-for-mfa"              │
│    }                                             │
│  }                                               │
│                                                  │
└──────────────────────────────────────────────────┘


STEP 6: Generate tokens
─────────────────────────────────
┌──────────────────────────────────────────────────┐
│                                                  │
│  Access Token (JWT, RS256):                      │
│  ┌────────────────────────────────────────┐     │
│  │ Header:  { alg: "RS256", typ: "JWT" }  │     │
│  │ Payload: {                              │     │
│  │   sub: "user-uuid-here",               │     │
│  │   email: "user@example.com",           │     │
│  │   exp: (now + 15 minutes)              │     │
│  │ }                                       │     │
│  │ Signature: RSA-SHA256(header+payload)  │     │
│  └────────────────────────────────────────┘     │
│                                                  │
│  Refresh Token (Random, stored hashed):          │
│  ┌────────────────────────────────────────┐     │
│  │ random-uuid-v4                         │     │
│  │ Stored in DB as: SHA256(token)         │     │
│  │ Expires: 7 days                        │     │
│  └────────────────────────────────────────┘     │
│                                                  │
└──────────────────────────────────────────────────┘


STEP 7: Create session
─────────────────────────────────
┌──────────────┐     ┌──────────────┐
│    Server    │────►│  PostgreSQL  │
│              │     │              │
│  INSERT INTO │     │   Sessions   │
│  sessions    │     │  ┌─────────┐ │
│  (userId,    │     │  │ userId  │ │
│   tokenHash, │     │  │ token   │ │
│   ip,        │     │  │ ip      │ │
│   userAgent) │     │  │ agent   │ │
│              │     │  └─────────┘ │
└──────────────┘     └──────────────┘


STEP 8: Log the event
─────────────────────────────────
┌──────────────┐     ┌──────────────┐
│    Server    │────►│  PostgreSQL  │
│              │     │              │
│  INSERT INTO │     │  AuditLogs   │
│  audit_logs  │     │  ┌─────────┐ │
│  (action:    │     │  │ sign_in │ │
│   "sign_in") │     │  │ success │ │
│              │     │  └─────────┘ │
└──────────────┘     └──────────────┘


STEP 9: Return tokens to browser
─────────────────────────────────
┌──────────────┐
│   Browser    │
│              │
│  Receives:   │◄─────── {
│  - accessToken        accessToken: "eyJ...",
│  - refreshToken       refreshToken: "uuid...",
│  - user               user: { id, email, ... }
│              │        }
└──────────────┘


STEP 10: Token stored, user redirected
─────────────────────────────────
┌──────────────┐
│   Browser    │
│              │
│  Store token │
│  in memory   │──────►  /dashboard
│              │
│  🎉 Logged   │
│     in!      │
└──────────────┘
```

### 2.7 Security Deep Dive

#### Password Hashing: Why Argon2id?

**The Problem:**
If someone steals your database, they get all the passwords... unless you hash them.

**What is hashing?**
Hashing is a one-way transformation. You can turn a password INTO a hash, but you can't turn a hash BACK into a password.

```
"password123" → Hash function → "$argon2id$v=19$m=65536..."
                                          ↑
                                    Can't reverse!
```

**Why Argon2id specifically?**

| Algorithm | Problem | Status |
|-----------|---------|--------|
| MD5 | Broken, collisions found | ❌ NEVER USE |
| SHA-1 | Broken, collisions found | ❌ NEVER USE |
| SHA-256 | Too fast! GPUs can try billions/sec | ⚠️ Not for passwords |
| bcrypt | Good but limited memory usage | ✓ OK |
| **Argon2id** | Winner of Password Hashing Competition | ✓✓ **BEST** |

**How Argon2id protects against attacks:**

```
Attacker's GPU trying to crack passwords:
─────────────────────────────────────────

SHA-256:
┌────────────────────────────────────────────────────┐
│  GPU: 10 billion hashes/second                     │
│  8-character password: CRACKED in seconds          │
└────────────────────────────────────────────────────┘

Argon2id (our settings):
┌────────────────────────────────────────────────────┐
│  Memory required: 64MB per hash                    │
│  GPU memory: 8GB = only 125 parallel attempts      │
│  Iterations: 3 (takes time)                        │
│                                                    │
│  Result: ~100 hashes/second (100 million x slower) │
│  8-character password: YEARS to crack              │
└────────────────────────────────────────────────────┘
```

#### JWT Tokens: How They Work

**What is a JWT?**
JWT (JSON Web Token) is like a digital passport. It contains information about who you are, and it's signed so nobody can forge it.

```
JWT Structure:
═════════════

┌─────────────────────────────────────────────────────────────────┐
│                         JWT TOKEN                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HEADER (What algorithm signs this?)                             │
│  ─────────────────────────────────                               │
│  {                                                               │
│    "alg": "RS256",    // RSA with SHA-256                        │
│    "typ": "JWT"       // This is a JWT                           │
│  }                                                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  PAYLOAD (Who is this user?)                                     │
│  ────────────────────────────                                    │
│  {                                                               │
│    "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID    │
│    "email": "user@example.com",                                  │
│    "name": "John Doe",                                           │
│    "iat": 1705320000,    // Issued at (timestamp)                │
│    "exp": 1705320900     // Expires at (15 min later)            │
│  }                                                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  SIGNATURE (Proof this is real)                                  │
│  ──────────────────────────────                                  │
│  RSA-SHA256(                                                     │
│    base64(header) + "." + base64(payload),                       │
│    PRIVATE_KEY    // Only server has this!                       │
│  )                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why RS256 (asymmetric) instead of HS256 (symmetric)?**

```
HS256 (Symmetric - Same key signs and verifies):
────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Auth Server          Microservice A          Microservice B      │
│  ┌─────────┐          ┌─────────┐            ┌─────────┐         │
│  │ SECRET  │          │ SECRET  │            │ SECRET  │         │
│  │   KEY   │          │   KEY   │            │   KEY   │         │
│  └─────────┘          └─────────┘            └─────────┘         │
│       │                    │                      │               │
│       └────────────────────┴──────────────────────┘               │
│                            │                                      │
│                     ONE KEY = ONE RISK                            │
│           If ANY service is hacked, attacker can                  │
│           CREATE fake tokens (not just verify)                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘


RS256 (Asymmetric - Different keys for signing and verifying):
──────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Auth Server          Microservice A          Microservice B      │
│  ┌─────────┐          ┌─────────┐            ┌─────────┐         │
│  │ PRIVATE │          │ PUBLIC  │            │ PUBLIC  │         │
│  │   KEY   │          │   KEY   │            │   KEY   │         │
│  │ (sign)  │          │(verify) │            │(verify) │         │
│  └─────────┘          └─────────┘            └─────────┘         │
│       │                    │                      │               │
│       │              Can ONLY verify              │               │
│       │              Can NOT create               │               │
│       │                                                           │
│       └─── ONLY this can create tokens                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Even if public key leaks, attackers can only VERIFY, not CREATE tokens!
```

### 2.8 Database Schema Explained

Here's a visual representation of our main database tables and how they relate:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │       User       │
                         ├──────────────────┤
                         │ id (PK)          │
                         │ email (UNIQUE)   │
                         │ passwordHash     │
                         │ firstName        │
                         │ lastName         │
                         │ emailVerified    │
                         │ mfaEnabled       │
                         │ mfaSecret        │
                         │ publicMetadata   │
                         │ privateMetadata  │
                         │ unsafeMetadata   │
                         │ createdAt        │
                         │ updatedAt        │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐
│     Session     │    │  OAuthAccount   │    │ OrganizationMember  │
├─────────────────┤    ├─────────────────┤    ├─────────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)             │
│ userId (FK)     │    │ userId (FK)     │    │ userId (FK)         │
│ refreshTokenHash│    │ provider        │    │ organizationId (FK) │
│ ipAddress       │    │ providerAcctId  │    │ role                │
│ userAgent       │    │ accessToken     │    │ permissions[]       │
│ expiresAt       │    │ email           │    │ createdAt           │
│ status          │    │ avatarUrl       │    └──────────┬──────────┘
│ createdAt       │    │ createdAt       │               │
└─────────────────┘    └─────────────────┘               │
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │  Organization   │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ name            │
                                              │ slug (UNIQUE)   │
                                              │ imageUrl        │
                                              │ maxMembers      │
                                              │ publicMetadata  │
                                              │ createdAt       │
                                              └─────────────────┘


Supporting Tables:
──────────────────

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    AuditLog     │    │     Webhook     │    │     ApiKey      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ userId (FK)     │    │ url             │    │ name            │
│ action          │    │ secret          │    │ keyHash         │
│ entityType      │    │ events[]        │    │ keyPrefix       │
│ entityId        │    │ enabled         │    │ scopes[]        │
│ ipAddress       │    │ createdAt       │    │ expiresAt       │
│ userAgent       │    └─────────────────┘    │ lastUsedAt      │
│ metadata (JSON) │                           └─────────────────┘
│ status          │
│ createdAt       │
└─────────────────┘
```

**Understanding the Three Metadata Fields:**

| Field | Who can see it? | Who can edit it? | Use case |
|-------|-----------------|------------------|----------|
| `publicMetadata` | Frontend + Backend | Only Backend | Display name, avatar, plan type |
| `privateMetadata` | Only Backend | Only Backend | Stripe ID, internal flags |
| `unsafeMetadata` | Frontend + Backend | User can edit | Preferences, theme, language |

---

## 3. Infrastructure (DevOps Perspective)

This section covers Docker, CI/CD, and deployment - explained step by step.

### 3.1 Docker 101 - The Basics

**What is Docker?**

Docker is like a "shipping container" for software. Just like a shipping container can hold any goods and be transported on any ship, a Docker container can hold any application and run on any server.

```
Traditional Deployment (Problems):
──────────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Developer's laptop:           Production server:                 │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │ Node.js 20.1    │          │ Node.js 18.3    │  ← MISMATCH!  │
│  │ npm 10.2        │          │ npm 9.1         │  ← MISMATCH!  │
│  │ PostgreSQL 15   │          │ PostgreSQL 14   │  ← MISMATCH!  │
│  └─────────────────┘          └─────────────────┘               │
│                                                                   │
│  "It works on my machine!" → Breaks in production                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘


Docker Deployment (Solution):
────────────────────────────
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Developer's laptop:           Production server:                 │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │ Docker          │          │ Docker          │               │
│  │ ┌─────────────┐ │          │ ┌─────────────┐ │               │
│  │ │ Container   │ │   ═══►   │ │ Container   │ │               │
│  │ │ Node.js 20  │ │   SAME   │ │ Node.js 20  │ │               │
│  │ │ npm 10      │ │  IMAGE   │ │ npm 10      │ │               │
│  │ │ PostgreSQL  │ │          │ │ PostgreSQL  │ │               │
│  │ └─────────────┘ │          │ └─────────────┘ │               │
│  └─────────────────┘          └─────────────────┘               │
│                                                                   │
│  Same container everywhere = Works everywhere                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key Docker Concepts:**

| Concept | What it is | Analogy |
|---------|-----------|---------|
| **Image** | A blueprint for a container | Recipe for a cake |
| **Container** | A running instance of an image | An actual cake |
| **Dockerfile** | Instructions to build an image | Step-by-step recipe |
| **Volume** | Persistent storage | A pantry that survives cleanup |
| **Network** | Communication between containers | A phone line between rooms |

### 3.2 Docker Compose - Running Multiple Containers

**What is Docker Compose?**

Docker Compose is like a recipe book that says "start these 5 containers together, in this order, connected like this."

**Our Production Setup:**

```
┌─────────────────────────────────────────────────────────────────┐
│                   DOCKER COMPOSE ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
│                            │                                     │
│                            ▼                                     │
│              ┌─────────────────────────┐                        │
│              │    Nginx Proxy Manager   │                        │
│              │    (Reverse Proxy)       │                        │
│              │                          │                        │
│              │  api.bastionauth.dev     │                        │
│              │  admin.bastionauth.dev   │                        │
│              │  app.bastionauth.dev     │                        │
│              └───────────┬──────────────┘                        │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│            DOCKER COMPOSE STACK                                   │
│                          │                                        │
│     ┌────────────────────┼────────────────────┐                  │
│     │                    │                    │                   │
│     ▼                    ▼                    ▼                   │
│ ┌────────┐          ┌────────┐          ┌────────┐              │
│ │ Server │          │ Admin  │          │Example │              │
│ │ :3001  │          │ :3002  │          │ :3000  │              │
│ │        │          │        │          │        │              │
│ │Fastify │          │Next.js │          │Next.js │              │
│ │  API   │          │  App   │          │  App   │              │
│ └───┬────┘          └───┬────┘          └───┬────┘              │
│     │                   │                   │                    │
│     │                   └───────────────────┘                    │
│     │                           │                                │
│     │              Uses Server API                               │
│     │                                                            │
│     │                                                            │
│     ▼                                                            │
│ ┌────────────────────────────────────────┐                       │
│ │               DATA LAYER               │                       │
│ │                                        │                       │
│ │   ┌────────────┐    ┌────────────┐    │                       │
│ │   │ PostgreSQL │    │   Redis    │    │                       │
│ │   │   :5432    │    │   :6379    │    │                       │
│ │   │            │    │            │    │                       │
│ │   │   Users    │    │  Sessions  │    │                       │
│ │   │  Sessions  │    │Rate Limits │    │                       │
│ │   │   Orgs     │    │   Cache    │    │                       │
│ │   └─────┬──────┘    └─────┬──────┘    │                       │
│ │         │                 │           │                       │
│ │         ▼                 ▼           │                       │
│ │   ┌──────────┐      ┌──────────┐     │                       │
│ │   │ postgres │      │  redis   │     │                       │
│ │   │  _data   │      │  _data   │     │                       │
│ │   │ (volume) │      │ (volume) │     │                       │
│ │   └──────────┘      └──────────┘     │                       │
│ │                                       │                       │
│ └───────────────────────────────────────┘                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Understanding docker-compose.prod.yml

Let's break down each service in our production Docker Compose file:

**1. PostgreSQL Container**

```yaml
# What this does: Creates a PostgreSQL database
postgres:
  image: postgres:15-alpine          # Official PostgreSQL image (alpine = smaller)
  container_name: bastionauth-postgres
  restart: unless-stopped            # Auto-restart if it crashes
  
  environment:
    # Database credentials (from .env file, NEVER hardcode!)
    POSTGRES_USER: ${DB_USER:-bastionauth}      # Default: bastionauth
    POSTGRES_PASSWORD: ${DB_PASSWORD:?required} # REQUIRED, no default
    POSTGRES_DB: ${DB_NAME:-bastionauth}        # Default: bastionauth
  
  volumes:
    # This line is CRITICAL - without it, data is lost on restart!
    - postgres_data:/var/lib/postgresql/data
    #     ↑                     ↑
    #     │                     └── Where PostgreSQL stores data
    #     └── Named volume (survives container restart)
  
  healthcheck:
    # Docker uses this to know when PostgreSQL is ready
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bastionauth}"]
    interval: 10s    # Check every 10 seconds
    timeout: 5s      # Give up after 5 seconds
    retries: 5       # Try 5 times before marking unhealthy
```

**Why volumes matter:**

```
Without volume:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Container starts → Data created → Container restarts → 💀 GONE │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

With volume:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Container starts → Data in volume → Container restarts → ✅ OK │
│                                        Volume still has data     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**2. Redis Container**

```yaml
# What this does: Creates a Redis cache
redis:
  image: redis:7-alpine
  container_name: bastionauth-redis
  restart: unless-stopped
  
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  #                      ↑                  ↑
  #                      │                  └── Require password
  #                      └── Save to disk (persistence)
  
  volumes:
    - redis_data:/data    # Persist Redis data
  
  healthcheck:
    test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
    # Sends PING to Redis, expects PONG
```

**3. Server Container**

```yaml
# What this does: Runs the BastionAuth API server
server:
  build:
    context: ..                          # Build from parent directory
    dockerfile: packages/server/Dockerfile
  
  depends_on:
    postgres:
      condition: service_healthy         # Wait for PostgreSQL to be READY
    redis:
      condition: service_healthy         # Wait for Redis to be READY
  #
  # IMPORTANT: Without "condition: service_healthy", the server
  # might start before the database is ready = CRASH
  
  environment:
    NODE_ENV: production
    PORT: 3001
    
    # Database connection string
    DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    #                                                      ↑
    #                                        Container NAME, not localhost!
    
    # Redis connection string
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    #                                      ↑
    #                         Container NAME, not localhost!
    
    # JWT Keys (for signing tokens)
    JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY:?required}
    JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY:?required}
    
    # Encryption key (for sensitive data)
    ENCRYPTION_KEY: ${ENCRYPTION_KEY:?required}
```

**Common Mistake: Using localhost**

```
WRONG:
DATABASE_URL: postgresql://user:pass@localhost:5432/db
              ↑
              This refers to the container itself, not PostgreSQL!

RIGHT:
DATABASE_URL: postgresql://user:pass@postgres:5432/db
              ↑
              This is the container NAME from docker-compose
```

### 3.4 CI/CD Pipeline Explained

**What is CI/CD?**

- **CI (Continuous Integration)**: Automatically test code when you push
- **CD (Continuous Deployment)**: Automatically deploy code when tests pass

Our pipeline runs on every push to the `main` branch:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                              │
└─────────────────────────────────────────────────────────────────┘

Developer pushes to main
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     JOB 1: LINT (~30 seconds)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Checkout code from GitHub                                    │
│     └── Downloads your repository                                │
│                                                                  │
│  2. Setup pnpm                                                   │
│     └── Installs the package manager                             │
│                                                                  │
│  3. Install dependencies                                         │
│     └── pnpm install --frozen-lockfile                           │
│         (frozen = use exact versions from lockfile)              │
│                                                                  │
│  4. Run linter                                                   │
│     └── pnpm lint                                                │
│         Checks for:                                              │
│         • Unused variables                                       │
│         • Missing semicolons                                     │
│         • Code style issues                                      │
│                                                                  │
│  ✓ Pass → Continue to Build                                      │
│  ✗ Fail → Stop pipeline, notify developer                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JOB 2: BUILD (~3 minutes)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Checkout code                                                │
│                                                                  │
│  2. Setup Docker Buildx                                          │
│     └── Advanced Docker builder with caching                     │
│                                                                  │
│  3. Login to GitHub Container Registry (GHCR)                    │
│     └── Where we store Docker images                             │
│                                                                  │
│  4. Build Docker image                                           │
│     └── Creates image from Dockerfile                            │
│                                                                  │
│  5. Push to GHCR                                                 │
│     └── ghcr.io/your-org/bastionauth:latest                      │
│                                                                  │
│  ✓ Pass → Continue to Deploy                                     │
│  ✗ Fail → Stop pipeline, notify developer                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   JOB 3: DEPLOY (~30 seconds)                    │
│                   (Only runs on main branch)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SSH into VPS                                                 │
│     └── Connect to production server                             │
│                                                                  │
│  2. Pull latest code                                             │
│     └── git pull origin main                                     │
│                                                                  │
│  3. Rebuild containers                                           │
│     └── docker-compose build --no-cache                          │
│         (--no-cache = fresh build, no cached layers)             │
│                                                                  │
│  4. Restart containers                                           │
│     └── docker-compose up -d                                     │
│         (-d = detached/background mode)                          │
│                                                                  │
│  ✓ Done → Application deployed!                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Environment Variables Reference

**GitHub Secrets (for CI/CD):**

| Secret | Description | How to Generate |
|--------|-------------|-----------------|
| `VPS_HOST` | Your server's IP address | From Hostinger dashboard |
| `VPS_USER` | SSH username | Usually `root` |
| `VPS_SSH_KEY` | SSH private key | `ssh-keygen -t ed25519 -C "github-actions"` |
| `VPS_PORT` | SSH port | Usually `22` |
| `JWT_PRIVATE_KEY` | RSA private key (4096-bit) | `openssl genrsa -out private.pem 4096` |
| `JWT_PUBLIC_KEY` | RSA public key | `openssl rsa -in private.pem -pubout -out public.pem` |
| `ENCRYPTION_KEY` | 32-byte hex string | `openssl rand -hex 32` |
| `CSRF_SECRET` | Random string | `openssl rand -base64 32` |

**Server Environment Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (default: 3001) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_PRIVATE_KEY` | Yes | RSA private key for signing JWTs |
| `JWT_PUBLIC_KEY` | Yes | RSA public key for verifying JWTs |
| `ENCRYPTION_KEY` | Yes | 64-character hex string for AES-256 |
| `CSRF_SECRET` | Yes | Secret for CSRF protection |
| `FRONTEND_URL` | Yes | Your frontend URL (for CORS) |
| `SMTP_HOST` | No | Email server host |
| `SMTP_PORT` | No | Email server port |
| `SMTP_USER` | No | Email server username |
| `SMTP_PASSWORD` | No | Email server password |
| `GOOGLE_CLIENT_ID` | No | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | For Google OAuth |
| `GITHUB_CLIENT_ID` | No | For GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | No | For GitHub OAuth |

### 3.6 First-Time Server Setup

If you're setting up a new VPS from scratch:

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Update the system
apt update && apt upgrade -y

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Install Docker Compose
apt install docker-compose-plugin -y

# 5. Clone the repository
git clone https://github.com/your-org/bastionauth.git
cd bastionauth

# 6. Create environment file
cd docker
cp env.example .env
nano .env  # Edit with your values

# 7. Start the application
docker-compose -f docker-compose.prod.yml up -d

# 8. Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 4. Quality Assurance (QA Perspective)

This section covers how to test BastionAuth locally and what safeguards exist in our pipeline.

### 4.1 Testing Pyramid

We follow the standard testing pyramid:

```
                    ▲
                   /│\
                  / │ \        E2E Tests (10%)
                 /  │  \       ─────────────────
                /   │   \      • Full user flows
               /    │    \     • Real browsers
              /     │     \    • Slowest but most realistic
             /──────│──────\   • ~10 tests
            /       │       \
           /        │        \
          /    Integration    \  Integration Tests (30%)
         /      Tests          \ ─────────────────────────
        /        (30%)          \• Multiple components together
       /──────────│──────────────\• API contract tests
      /           │               \• ~30 tests
     /            │                \
    /             │                 \
   /         Unit Tests              \ Unit Tests (60%)
  /            (60%)                  \─────────────────
 /────────────────────────────────────\• Individual functions
│                                      │• Fastest
│  Test single functions in isolation  │• ~100+ tests
│                                      │
└──────────────────────────────────────┘
```

### 4.2 Running Tests Locally

**Prerequisites:**
```bash
# Make sure Docker is running
pnpm docker:up

# Run database migrations
pnpm db:migrate

# Seed test data (creates test users)
pnpm db:seed
```

**Unit Tests (Vitest):**

```bash
# Run all unit tests
pnpm test

# Run tests for a specific package
pnpm --filter @bastionauth/server test

# Watch mode (re-runs on file save)
pnpm test:watch

# With coverage report
pnpm test:coverage

# Run a specific test file
pnpm --filter @bastionauth/server test src/utils/crypto.test.ts
```

**E2E Tests (Playwright):**

```bash
# Run all E2E tests
pnpm test:e2e

# Run with visual UI (recommended for debugging!)
pnpm test:e2e:ui

# Run specific test file
npx playwright test e2e/auth-flow.spec.ts

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see the browser)
npx playwright test --headed

# Debug mode (step through tests)
npx playwright test --debug
```

**Load Tests (k6):**

```bash
# Install k6 first (macOS)
brew install k6

# Or (Linux)
sudo apt install k6

# Run load test
k6 run tests/load/auth-load.js

# Run with more virtual users
k6 run --vus 50 --duration 60s tests/load/auth-load.js
```

### 4.3 Understanding Test Files

**Unit Test Structure:**

```typescript
// File: packages/server/tests/utils/crypto.test.ts

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/utils/crypto';

// describe() groups related tests
describe('Crypto Utils', () => {
  
  // describe() can be nested for sub-groups
  describe('encrypt/decrypt', () => {
    
    // it() defines a single test case
    it('should encrypt and decrypt a string', async () => {
      // ARRANGE: Set up test data
      const original = 'my-secret-data';
      
      // ACT: Run the function being tested
      const encrypted = await encrypt(original);
      const decrypted = await decrypt(encrypted);
      
      // ASSERT: Check the results
      expect(decrypted).toBe(original);           // Should match
      expect(encrypted).not.toBe(original);       // Should be different
      expect(encrypted).toContain(':');           // Should have format
    });
    
    it('should produce different outputs for same input', async () => {
      // Each encryption should be unique (random IV)
      const text = 'same-text';
      const encrypted1 = await encrypt(text);
      const encrypted2 = await encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
    
  });
  
});
```

**E2E Test Structure:**

```typescript
// File: e2e/auth-flow.spec.ts

import { test, expect } from '@playwright/test';

// test.describe() groups related tests
test.describe('Authentication Flow', () => {
  
  // test.beforeEach() runs before each test
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear any existing session
    await page.goto('/');
  });
  
  // test() defines a single test case
  test('user can sign up with valid credentials', async ({ page }) => {
    // Navigate to sign up page
    await page.goto('/sign-up');
    
    // Fill in the form
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for and verify redirect
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Verify we see the dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('user cannot sign up with weak password', async ({ page }) => {
    await page.goto('/sign-up');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'weak');  // Too short!
    
    await page.click('button[type="submit"]');
    
    // Should show error, NOT redirect
    await expect(page.locator('.error')).toBeVisible();
    await expect(page).not.toHaveURL('/dashboard');
  });
  
});
```

**API Contract Test Structure:**

```typescript
// File: e2e/api/auth.api.spec.ts

import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('Auth API', () => {
  
  test('POST /auth/sign-up should create user', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/sign-up`, {
      data: {
        email: `api-test-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    // Check response status
    expect(response.status()).toBe(201);
    
    // Check response body structure
    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    
    // Check user structure
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).not.toHaveProperty('passwordHash'); // Security!
  });
  
  test('POST /auth/sign-in should return tokens', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/sign-in`, {
      data: {
        email: 'test@example.com',     // Seeded user
        password: 'SecurePass123!'
      }
    });
    
    // May be rate limited in CI
    expect([200, 429]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.accessToken).toBeTruthy();
      expect(body.refreshToken).toBeTruthy();
    }
  });
  
});
```

### 4.4 Test File Locations

| Test Type | Location | Framework | What It Tests |
|-----------|----------|-----------|---------------|
| Core unit | `packages/core/tests/` | Vitest | Validation, utils |
| Server unit | `packages/server/tests/` | Vitest | Services, crypto |
| E2E flows | `e2e/*.spec.ts` | Playwright | Full user journeys |
| API contract | `e2e/api/*.spec.ts` | Playwright | API endpoints |
| Load | `tests/load/` | k6 | Performance |

### 4.5 Common Test Issues and Solutions

**Issue: "Rate limited" errors**

```
Symptom: Tests fail with 429 Too Many Requests
Cause: Rate limiter blocks too many login attempts

Solutions:
1. Tests run serially in CI (workers: 1)
2. Reset Redis between test files:
   await request.post('http://localhost:3001/test/reset-rate-limits')
3. Use unique emails for each test
```

**Issue: E2E tests timeout**

```
Symptom: Tests hang and eventually fail with timeout
Cause: Server not started or database not seeded

Solution:
1. Make sure Docker is running:
   pnpm docker:up
   
2. Run migrations:
   pnpm db:migrate
   
3. Seed test data:
   pnpm db:seed
   
4. Then run tests:
   pnpm test:e2e
```

**Issue: "User not found" in tests**

```
Symptom: Sign-in tests fail with "Invalid credentials"
Cause: Database not seeded with test users

Solution:
pnpm db:seed

This creates:
- admin@bastionauth.dev (password: AdminPass123!)
- test@example.com (password: SecurePass123!)
```

**Issue: Tests pass locally but fail in CI**

```
Symptom: Green locally, red in GitHub Actions
Cause: Usually timing or environment differences

Solutions:
1. Check if it's a rate limit issue (CI is slower)
2. Add explicit waits: await page.waitForURL('/dashboard')
3. Use retry configuration in playwright.config.ts
4. Check environment variables in CI workflow
```

### 4.6 Seeded Test Data

When you run `pnpm db:seed`, these accounts are created:

| Email | Password | Role | Use For |
|-------|----------|------|---------|
| `admin@bastionauth.dev` | `AdminPass123!` | Admin | Admin dashboard tests |
| `test@example.com` | `SecurePass123!` | User | Regular user tests |

An organization is also created:
- **Name**: Acme Inc
- **Slug**: `acme-inc`
- **Members**: Both users above

---

## 5. Workflow (Team Lead/PM Perspective)

This section covers how we work as a team - git workflow, code reviews, and project standards.

### 5.1 Definition of Done

A feature is considered "done" when ALL of these are true:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEFINITION OF DONE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Code compiles without errors                                  │
│    └── pnpm build                                                │
│                                                                  │
│  □ Linting passes                                                │
│    └── pnpm lint                                                 │
│                                                                  │
│  □ Unit tests pass                                               │
│    └── pnpm test                                                 │
│                                                                  │
│  □ E2E tests pass (if applicable)                                │
│    └── pnpm test:e2e                                             │
│                                                                  │
│  □ Code reviewed and approved by at least 1 team member          │
│                                                                  │
│  □ No TypeScript errors                                          │
│    └── pnpm typecheck                                            │
│                                                                  │
│  □ Documentation updated (if user-facing change)                 │
│                                                                  │
│  □ PR merged to main branch                                      │
│                                                                  │
│  □ Successfully deployed to production (automatic via CI/CD)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Git Workflow

We use a simplified GitHub Flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                       GIT WORKFLOW                               │
└─────────────────────────────────────────────────────────────────┘

    main branch (always deployable)
    ─────●─────────────────●─────────────────●─────────
         │                 │                 │
         │  ┌─────────────●│                 │
         │  │  feature/   ││                 │
         │  │  add-mfa    ││                 │
         │  │             ││                 │
         │  └─────────────●┘                 │
         │         │                         │
         │         └── PR merged             │
         │                                   │
         │                    ┌─────────────●┘
         │                    │  fix/
         │                    │  rate-limit
         │                    │
         │                    └─────────────●
         │                          │
         │                          └── PR merged
         │
    Every merge to main = automatic deployment
```

### 5.3 Branch Naming Convention

| Prefix | When to Use | Example |
|--------|-------------|---------|
| `feature/` | Adding new functionality | `feature/passkey-auth` |
| `fix/` | Fixing a bug | `fix/session-expiry` |
| `docs/` | Documentation only | `docs/api-reference` |
| `refactor/` | Code cleanup (no behavior change) | `refactor/auth-service` |
| `test/` | Adding or updating tests | `test/mfa-coverage` |
| `chore/` | Maintenance tasks | `chore/update-deps` |

**Examples of good branch names:**
- `feature/google-oauth`
- `fix/password-reset-email`
- `docs/deployment-guide`
- `refactor/simplify-token-logic`

### 5.4 Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type | When to Use | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (1.x.0) |
| `fix` | Bug fix | Patch (1.0.x) |
| `docs` | Documentation only | None |
| `style` | Formatting, no code change | None |
| `refactor` | Code change, no behavior change | None |
| `test` | Adding/updating tests | None |
| `chore` | Maintenance, deps | None |

**Good commit messages:**

```bash
# Feature
feat(auth): add passkey authentication support

Implements WebAuthn registration and authentication flow.
- Add passkey model to database
- Create registration/verification endpoints
- Add React hook for passkey management

# Bug fix
fix(server): handle expired refresh tokens correctly

Previously, expired tokens returned 500. Now returns 401
with a clear error message.

Closes #123

# Documentation
docs(readme): add deployment instructions

# Refactor
refactor(auth): extract token validation to separate module

No behavior changes. Improves testability.

# Dependencies
chore(deps): update fastify to 4.25.0
```

**Bad commit messages:**

```bash
# Too vague
fix: fixed stuff

# No type
added new feature

# Not descriptive
feat: update

# Too long first line
feat(auth): implemented the new authentication system with passkey support and also fixed some bugs
```

### 5.5 Pull Request Process

**Step 1: Create a branch**
```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

**Step 2: Make changes and commit**
```bash
# Make your changes...

git add .
git commit -m "feat(auth): add password strength indicator"
```

**Step 3: Push and create PR**
```bash
git push -u origin feature/my-feature
```
Then go to GitHub and click "Create Pull Request"

**Step 4: PR Template**

When creating a PR, fill out this template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would break existing functionality)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran.
- [ ] Unit tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
```

**Step 5: Code Review**

- At least 1 approval required
- Address all comments
- Re-request review after making changes

**Step 6: Merge**

- Use "Squash and merge" for clean history
- Delete branch after merge

**Step 7: Automatic Deployment**

Once merged to `main`, CI/CD automatically:
1. Runs lint
2. Builds Docker image
3. Deploys to production

### 5.6 Project Principles

**Security First**
```
Every change must consider security:
- Never log sensitive data (passwords, tokens)
- Always validate input
- Use parameterized queries (Prisma handles this)
- Follow the principle of least privilege
```

**Developer Experience**
```
Our goal is to make BastionAuth easy to use:
- Clear error messages
- Comprehensive documentation
- Working examples
- Type safety everywhere
```

**Self-Hostable**
```
BastionAuth must work anywhere:
- No vendor lock-in
- Just Docker + environment variables
- Reasonable resource requirements
- Clear deployment guides
```

### 5.7 Getting Help

| Question Type | Where to Ask |
|--------------|--------------|
| Code questions | PR comments or team Slack |
| Architecture decisions | GitHub Discussions |
| Bug reports | GitHub Issues |
| Security concerns | Direct message to security lead |
| Documentation | `docs/` folder or wiki |

---

## 6. Quick Reference

### Common Commands

```bash
# =====================================
# DEVELOPMENT
# =====================================

# Install dependencies (run after cloning)
pnpm install

# Start all services in development mode
pnpm dev

# Start only the server
pnpm --filter @bastionauth/server dev

# Start only the admin dashboard
pnpm --filter @bastionauth/admin dev


# =====================================
# DOCKER
# =====================================

# Start Docker containers (PostgreSQL, Redis)
pnpm docker:up

# Stop Docker containers
pnpm docker:down

# View Docker logs
pnpm docker:logs

# Rebuild containers
docker-compose -f docker/docker-compose.yml up -d --build


# =====================================
# DATABASE
# =====================================

# Generate Prisma client (after schema changes)
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Push schema changes (development only)
pnpm db:push

# Seed test data
pnpm db:seed

# Open Prisma Studio (visual database editor)
pnpm db:studio


# =====================================
# TESTING
# =====================================

# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui


# =====================================
# CODE QUALITY
# =====================================

# Run linter
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check

# Type check all packages
pnpm typecheck


# =====================================
# BUILDING
# =====================================

# Build all packages
pnpm build

# Build specific package
pnpm --filter @bastionauth/server build

# Clean all build artifacts
pnpm clean


# =====================================
# KEYS & SECRETS
# =====================================

# Generate JWT keys
pnpm generate:keys

# Or manually:
# Generate private key
openssl genrsa -out private.pem 4096

# Generate public key from private
openssl rsa -in private.pem -pubout -out public.pem

# Generate encryption key
openssl rand -hex 32

# Generate CSRF secret
openssl rand -base64 32
```

### File Locations

| What | Where |
|------|-------|
| Server source code | `packages/server/src/` |
| React SDK source | `packages/react/src/` |
| Next.js SDK source | `packages/nextjs/src/` |
| Admin dashboard | `packages/admin/src/` |
| Database schema | `packages/server/src/prisma/schema.prisma` |
| API routes | `packages/server/src/routes/` |
| Unit tests | `packages/*/tests/` |
| E2E tests | `e2e/` |
| Docker config | `docker/` |
| CI/CD config | `.github/workflows/` |
| Documentation | `docs/` |

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Example app | 3000 | http://localhost:3000 |
| API server | 3001 | http://localhost:3001 |
| Admin dashboard | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 |
| Adminer (dev) | 8080 | http://localhost:8080 |
| Redis Commander (dev) | 8081 | http://localhost:8081 |

---

## 7. Troubleshooting Guide

### Issue: "Cannot connect to database"

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**
```bash
# 1. Check if Docker is running
docker ps

# 2. Start Docker containers
pnpm docker:up

# 3. Check container status
docker-compose -f docker/docker-compose.yml ps

# 4. Check container logs
docker-compose -f docker/docker-compose.yml logs postgres

# 5. Verify DATABASE_URL in .env
# Should be: postgresql://postgres:postgres@localhost:5432/bastionauth
```

### Issue: "Module not found"

**Symptoms:**
```
Error: Cannot find module '@bastionauth/core'
```

**Solutions:**
```bash
# 1. Install dependencies
pnpm install

# 2. Build packages (core must be built first)
pnpm build

# 3. If still failing, clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Issue: "Prisma client not generated"

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solutions:**
```bash
# Generate Prisma client
pnpm db:generate

# Or from server package
cd packages/server
pnpm prisma generate
```

### Issue: E2E tests timeout

**Symptoms:**
```
Timeout of 30000ms exceeded
```

**Solutions:**
```bash
# 1. Make sure Docker is running
pnpm docker:up

# 2. Make sure database is migrated
pnpm db:migrate

# 3. Make sure test data exists
pnpm db:seed

# 4. Start the server manually to check
pnpm --filter @bastionauth/server dev

# 5. Visit http://localhost:3001/health - should return OK
```

### Issue: "Rate limited" in tests

**Symptoms:**
```
Error 429: Too Many Requests
```

**Solutions:**
```bash
# 1. Run tests serially
npx playwright test --workers=1

# 2. Flush Redis (clears rate limits)
docker exec bastionauth-redis redis-cli FLUSHALL

# 3. Use unique emails in tests
const email = `test-${Date.now()}@example.com`;
```

### Issue: Git hooks failing

**Symptoms:**
```
husky - pre-commit hook failed
```

**Solutions:**
```bash
# 1. Fix linting issues
pnpm lint:fix

# 2. Fix formatting
pnpm format

# 3. If you need to skip (NOT recommended)
git commit --no-verify
```

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - how programs talk to each other |
| **Auth** | Authentication - verifying who someone is |
| **Argon2id** | A password hashing algorithm (the strongest available) |
| **CI/CD** | Continuous Integration/Deployment - automatic testing and deployment |
| **Container** | An isolated environment for running code (like a virtual machine but lighter) |
| **Docker** | A platform for running containers |
| **E2E** | End-to-End testing - testing the full user flow |
| **Fastify** | Our web framework (like Express but faster) |
| **GHCR** | GitHub Container Registry - where we store Docker images |
| **JWT** | JSON Web Token - a secure way to pass user identity |
| **MFA** | Multi-Factor Authentication - requiring multiple proofs of identity |
| **Monorepo** | One repository containing multiple related projects |
| **OAuth** | A protocol for "Sign in with Google/GitHub/etc." |
| **ORM** | Object-Relational Mapping - a way to interact with databases using code |
| **Playwright** | A tool for E2E browser testing |
| **PR** | Pull Request - a request to merge code changes |
| **Prisma** | Our database ORM |
| **Redis** | An in-memory database for fast operations |
| **RS256** | An algorithm for signing JWTs using RSA keys |
| **TOTP** | Time-based One-Time Password - used for MFA apps |
| **Turborepo** | A tool for managing monorepos |
| **Vitest** | Our unit testing framework |
| **VPS** | Virtual Private Server - a cloud server |
| **WebAuthn** | The standard for passkeys/biometric login |

---

## Welcome to the Team!

You've made it through the onboarding document! Here's what to do next:

1. **Set up your development environment** (Section 3.6)
2. **Run the tests locally** to make sure everything works (Section 4.2)
3. **Pick a "good first issue"** from GitHub Issues
4. **Ask questions** - there are no stupid questions!

Happy coding!

