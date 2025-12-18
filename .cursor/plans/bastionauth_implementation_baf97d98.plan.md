---
name: BastionAuth Implementation
overview: Build a complete, production-ready enterprise authentication system (Clerk alternative) with monorepo architecture, Fastify backend, React SDK, Next.js integration, and admin dashboard.
todos:
  - id: monorepo-setup
    content: Initialize pnpm workspace, Turborepo, TypeScript/ESLint/Prettier configs
    status: completed
  - id: docker-setup
    content: Create Docker compose files for PostgreSQL and Redis
    status: completed
    dependencies:
      - monorepo-setup
  - id: core-package
    content: Build @bastionauth/core with types, constants, and validation utilities
    status: completed
    dependencies:
      - monorepo-setup
  - id: server-prisma
    content: Create Prisma schema with all models and migrations
    status: completed
    dependencies:
      - docker-setup
      - core-package
  - id: server-foundation
    content: Build Fastify app with plugins (Prisma, Redis, CORS, rate limiting)
    status: completed
    dependencies:
      - server-prisma
  - id: server-auth-basic
    content: Implement sign-up, sign-in, sign-out, token refresh, password reset
    status: completed
    dependencies:
      - server-foundation
  - id: server-email
    content: Implement email verification and magic links with Resend
    status: completed
    dependencies:
      - server-auth-basic
  - id: server-mfa
    content: Implement TOTP MFA with backup codes and passkeys
    status: completed
    dependencies:
      - server-auth-basic
  - id: server-oauth
    content: Implement OAuth for Google, GitHub, Microsoft, Apple, LinkedIn
    status: completed
    dependencies:
      - server-auth-basic
  - id: server-organizations
    content: Implement organization management with RBAC
    status: completed
    dependencies:
      - server-auth-basic
  - id: server-webhooks
    content: Implement webhook system with delivery tracking
    status: completed
    dependencies:
      - server-foundation
  - id: server-admin-api
    content: Implement admin API endpoints and API keys
    status: completed
    dependencies:
      - server-auth-basic
      - server-organizations
  - id: react-sdk
    content: Build React SDK with provider, hooks, and @mawtech/glass-ui components
    status: completed
    dependencies:
      - server-auth-basic
  - id: nextjs-package
    content: Build Next.js middleware and server helpers
    status: completed
    dependencies:
      - react-sdk
  - id: admin-dashboard
    content: Build Next.js 14 admin dashboard with all management features
    status: completed
    dependencies:
      - server-admin-api
      - react-sdk
  - id: example-app
    content: Create example Next.js integration app
    status: completed
    dependencies:
      - nextjs-package
  - id: testing
    content: Write Vitest unit tests and Playwright E2E tests
    status: completed
    dependencies:
      - server-admin-api
      - react-sdk
  - id: documentation
    content: Create README, API docs, and guides
    status: completed
    dependencies:
      - example-app
---

# BastionAuth - Enterprise Authentication System

## Architecture Overview

```mermaid
graph TB
    subgraph clients [Client Applications]
        ReactApp[React App]
        NextApp[Next.js App]
        AdminDash[Admin Dashboard]
    end
    
    subgraph sdk [SDK Layer]
        ReactSDK[React SDK]
        NextSDK[Next.js SDK]
    end
    
    subgraph api [API Layer]
        FastifyAPI[Fastify API Server]
    end
    
    subgraph services [Services]
        AuthSvc[Auth Service]
        UserSvc[User Service]
        SessionSvc[Session Service]
        MFASvc[MFA Service]
        OAuthSvc[OAuth Service]
        OrgSvc[Organization Service]
        WebhookSvc[Webhook Service]
        AuditSvc[Audit Service]
        ApiKeySvc[API Key Service]
    end
    
    subgraph data [Data Layer]
        PostgreSQL[(PostgreSQL)]
        subgraph redis [Redis]
            Sessions[Sessions]
            RateLimiting[Rate Limiting]
            Cache[Cache]
        end
    end
    
    subgraph external [External Services]
        Resend[Resend Email]
        HIBP[HaveIBeenPwned]
        OAuthProviders[OAuth Providers]
    end
    
    subgraph webhookTargets [Webhook Targets]
        ClientWebhooks[Client Webhook Endpoints]
    end
    
    ReactApp --> ReactSDK
    NextApp --> NextSDK
    NextSDK --> ReactSDK
    AdminDash --> FastifyAPI
    
    ReactSDK --> FastifyAPI
    
    FastifyAPI --> AuthSvc
    FastifyAPI --> UserSvc
    FastifyAPI --> SessionSvc
    FastifyAPI --> MFASvc
    FastifyAPI --> OAuthSvc
    FastifyAPI --> OrgSvc
    FastifyAPI --> WebhookSvc
    FastifyAPI --> AuditSvc
    FastifyAPI --> ApiKeySvc
    
    AuthSvc --> PostgreSQL
    UserSvc --> PostgreSQL
    OrgSvc --> PostgreSQL
    WebhookSvc --> PostgreSQL
    AuditSvc --> PostgreSQL
    ApiKeySvc --> PostgreSQL
    
    SessionSvc --> Sessions
    AuthSvc --> RateLimiting
    FastifyAPI --> Cache
    
    AuthSvc --> Resend
    AuthSvc --> HIBP
    OAuthSvc --> OAuthProviders
    
    WebhookSvc -->|"Delivers events"| ClientWebhooks
```



## JWT Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as BastionAuth API
    participant Redis
    participant DB as PostgreSQL
    
    Note over Client,DB: Sign In Flow
    Client->>API: POST /auth/sign-in {email, password}
    API->>DB: Verify credentials
    DB-->>API: User record
    API->>API: Generate Access Token (15min, RS256)
    API->>API: Generate Refresh Token (7d, opaque)
    API->>Redis: Store refresh token hash
    API->>DB: Create Session record
    API-->>Client: {accessToken, refreshToken, user}
    
    Note over Client,DB: Authenticated Request
    Client->>API: GET /users/me (Authorization: Bearer accessToken)
    API->>API: Verify JWT signature + expiry
    API->>DB: Fetch user data
    API-->>Client: User profile
    
    Note over Client,DB: Token Refresh Flow
    Client->>API: POST /auth/refresh {refreshToken}
    API->>Redis: Verify token hash exists
    Redis-->>API: Valid
    API->>Redis: Delete old token, store new hash
    API->>API: Generate new access + refresh tokens
    API->>DB: Update session lastActiveAt
    API-->>Client: {accessToken, refreshToken}
    
    Note over Client,DB: Sign Out
    Client->>API: POST /auth/sign-out
    API->>Redis: Delete refresh token
    API->>DB: Mark session as REVOKED
    API-->>Client: {success: true}
```



## Webhook Delivery Flow

```mermaid
sequenceDiagram
    participant Event as Auth Event
    participant WebhookSvc as Webhook Service
    participant DB as PostgreSQL
    participant Queue as Redis Queue
    participant Worker as Webhook Worker
    participant Target as Client Webhook URL
    
    Event->>WebhookSvc: user.created event
    WebhookSvc->>DB: Find matching webhooks
    DB-->>WebhookSvc: Webhook configs
    
    loop For each webhook
        WebhookSvc->>DB: Create WebhookDelivery record
        WebhookSvc->>Queue: Enqueue delivery job
    end
    
    Queue->>Worker: Process job
    Worker->>Worker: Sign payload with HMAC
    Worker->>Target: POST webhook payload
    
    alt Success
        Target-->>Worker: 200 OK
        Worker->>DB: Update delivery status
    else Failure
        Target-->>Worker: Error/Timeout
        Worker->>DB: Increment attempts
        Worker->>Queue: Schedule retry with backoff
    end
```



## Implementation Phases

### Phase 1: Monorepo Foundation

- Initialize pnpm workspace with Turborepo
- Configure TypeScript, ESLint, Prettier
- Set up shared `@bastionauth/core` package with types, constants, and utilities
- Docker compose for PostgreSQL and Redis

### Phase 2: Server Package (Primary Focus)

- Fastify application with plugins (Prisma, Redis, CORS, Rate Limiting)
- Complete Prisma schema with all models
- Authentication services (sign-up, sign-in, sign-out, refresh tokens)
- Password hashing with Argon2id, JWT with RS256
- Email verification, password reset, magic links
- MFA with TOTP and backup codes
- OAuth integration (Google, GitHub, Microsoft, Apple, LinkedIn)
- Organization management with RBAC
- Session management with device fingerprinting
- Webhook system with delivery tracking
- Audit logging
- Admin API endpoints

### Phase 3: React SDK

- BastionProvider context with auth state management
- Hooks: useAuth, useUser, useSession, useOrganization, useSignIn, useSignUp
- Components using @mawtech/glass-ui: SignIn, SignUp, UserButton, UserProfile, OrganizationSwitcher, MFASetup
- API client with token refresh interceptor

### Phase 4: Next.js Integration

- Edge middleware helper for route protection
- Server-side helpers: auth(), currentUser()
- Client re-exports

### Phase 5: Admin Dashboard

- Next.js 14 App Router application
- Dashboard overview with statistics
- User management (list, detail, ban/unban, impersonate)
- Organization management
- Session management
- Audit logs viewer
- Webhook configuration
- API key management

### Phase 6: Example App & Documentation

- Example Next.js integration app
- API documentation (OpenAPI spec)
- Getting started guide
- Self-hosting guide

### Phase 7: Testing

- Vitest unit tests for services
- Playwright E2E tests for auth flows

---

## Key Files Structure

```javascript
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
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```



## Security Implementation

| Feature | Implementation ||---------|----------------|| Password Hashing | Argon2id (64MB memory, 3 iterations) || JWT Signing | RS256 with 15-min access tokens || Refresh Tokens | Opaque tokens, hashed storage, 7-day expiry || Rate Limiting | Sliding window via Redis sorted sets || Breach Detection | HaveIBeenPwned k-anonymity API || MFA | TOTP (RFC 6238) + encrypted backup codes || Encryption | AES-256-GCM for sensitive data at rest || CSRF | Double-submit cookie pattern |

## Estimated Implementation Order

Since you want server-first, I will build in this sequence:

1. **Monorepo setup** - Foundation files, configs, Docker
2. **Core package** - Types, constants, validation utilities
3. **Server package** - Complete API with all endpoints
4. **React SDK** - Provider, hooks, components
5. **Next.js package** - Middleware and server helpers
6. **Admin dashboard** - Full management UI
7. **Example app** - Integration demonstration
8. **Tests** - Unit and E2E coverage

---

## Detailed Authentication Flows

### Email/Password Sign In Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant SDK as React SDK
    participant API as Fastify API
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis
    participant Email as Resend Email

    Client->>SDK: signIn email password
    SDK->>API: POST /api/v1/auth/sign-in
    API->>Auth: validateCredentials
    
    Auth->>Redis: checkRateLimit ip email
    Redis-->>Auth: allowed true
    
    Auth->>DB: findUserByEmail
    DB-->>Auth: user record
    
    Auth->>Auth: verifyPassword input hash
    
    alt Password Invalid
        Auth->>DB: incrementFailedAttempts
        Auth->>Redis: recordFailedAttempt
        Auth-->>API: 401 Invalid credentials
        API-->>SDK: Error response
        SDK-->>Client: Show error
    end
    
    alt MFA Enabled
        Auth->>Redis: createMfaChallenge
        Auth-->>API: 200 requiresMfa true challengeId
        API-->>SDK: MFA required
        SDK-->>Client: Show MFA input
    else MFA Not Enabled
        Auth->>Auth: generateAccessToken user
        Auth->>Auth: generateRefreshToken
        Auth->>DB: createSession refreshTokenHash
        Auth->>Redis: cacheSession
        Auth->>DB: createAuditLog user.signed_in
        Auth-->>API: 200 user tokens
        API-->>SDK: Set httpOnly cookies
        SDK-->>Client: Redirect to dashboard
    end
```



### MFA Verification Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant SDK as React SDK
    participant API as Fastify API
    participant MFA as MFA Service
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis

    Client->>SDK: verifyMfa challengeId code
    SDK->>API: POST /api/v1/auth/mfa/verify
    API->>MFA: verifyTOTP
    
    MFA->>Redis: getMfaChallenge challengeId
    Redis-->>MFA: userId createdAt
    
    MFA->>DB: getUserMfaSecret userId
    DB-->>MFA: encrypted secret
    
    MFA->>MFA: decryptSecret
    MFA->>MFA: validateTOTP code secret
    
    alt Code Invalid
        MFA->>Redis: incrementMfaAttempts
        MFA-->>API: 401 Invalid code
        API-->>SDK: Error response
        SDK-->>Client: Show error
    else Code Valid
        MFA->>Redis: deleteMfaChallenge
        MFA->>Auth: createSession
        Auth->>DB: createSession
        Auth->>DB: createAuditLog user.signed_in_mfa
        Auth-->>API: 200 user tokens
        API-->>SDK: Set httpOnly cookies
        SDK-->>Client: Redirect to dashboard
    end
```



### Token Refresh Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant SDK as React SDK
    participant API as Fastify API
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis

    Note over Client,SDK: Access token expired after 15 min
    
    Client->>SDK: API request fails 401
    SDK->>SDK: getRefreshToken
    SDK->>API: POST /api/v1/auth/refresh
    
    API->>Auth: refreshSession
    Auth->>Auth: hashRefreshToken token
    Auth->>DB: findSessionByTokenHash
    
    alt Session Not Found or Revoked
        Auth-->>API: 401 Invalid session
        API-->>SDK: Clear cookies
        SDK-->>Client: Redirect to sign-in
    else Session Valid
        Auth->>Auth: generateNewAccessToken
        Auth->>Auth: generateNewRefreshToken
        Auth->>DB: updateSession newTokenHash
        Auth->>DB: revokeOldToken
        Auth->>Redis: updateCachedSession
        Auth-->>API: 200 accessToken refreshToken
        API-->>SDK: Set new cookies
        SDK->>SDK: Retry original request
        SDK-->>Client: Return data
    end
```



### OAuth Flow - Google Example

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant API as Fastify API
    participant OAuth as OAuth Service
    participant Google as Google OAuth
    participant DB as PostgreSQL
    participant Auth as Auth Service

    Client->>API: GET /api/v1/auth/oauth/google
    API->>OAuth: initiateOAuth google
    OAuth->>OAuth: generateState
    OAuth->>OAuth: generateCodeVerifier PKCE
    OAuth-->>API: redirectUrl
    API-->>Client: 302 Redirect to Google
    
    Client->>Google: Authorization page
    Google-->>Client: User grants permission
    Google->>API: GET /callback code state
    
    API->>OAuth: handleCallback
    OAuth->>OAuth: validateState
    OAuth->>Google: POST /token exchange code
    Google-->>OAuth: access_token id_token
    
    OAuth->>OAuth: decodeIdToken
    OAuth->>DB: findOAuthAccount provider providerId
    
    alt Account Exists
        DB-->>OAuth: existing user
    else New Account
        OAuth->>DB: createUser email name avatar
        OAuth->>DB: createOAuthAccount
        DB-->>OAuth: new user
    end
    
    OAuth->>Auth: createSession user
    Auth->>DB: createSession
    Auth->>DB: createAuditLog user.signed_in_oauth
    Auth-->>API: user tokens
    API-->>Client: 302 Redirect to app and set cookies
```



### Password Reset Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client App
    participant API as Fastify API
    participant Auth as Auth Service
    participant DB as PostgreSQL
    participant Redis as Redis
    participant Email as Resend Email

    Client->>API: POST /api/v1/auth/password/forgot
    API->>Auth: requestPasswordReset email
    
    Auth->>Redis: checkRateLimit email
    Redis-->>Auth: allowed
    
    Auth->>DB: findUserByEmail
    
    alt User Not Found
        Note over Auth: Return success anyway to prevent enumeration
        Auth-->>API: 200 success true
    else User Found
        Auth->>Auth: generateResetToken
        Auth->>Auth: hashToken
        Auth->>DB: createPasswordResetToken hash expiry
        Auth->>Email: sendPasswordResetEmail token
        Email-->>Auth: sent
        Auth-->>API: 200 success true
    end
    
    API-->>Client: Show check your email
    
    Note over Client: User clicks email link
    
    Client->>API: POST /api/v1/auth/password/reset
    API->>Auth: resetPassword token newPassword
    
    Auth->>Auth: hashToken
    Auth->>DB: findValidResetToken hash
    
    alt Token Invalid or Expired
        Auth-->>API: 400 Invalid token
    else Token Valid
        Auth->>Auth: hashPassword newPassword
        Auth->>DB: updateUserPassword hash
        Auth->>DB: markTokenUsed
        Auth->>DB: revokeAllSessions userId
        Auth->>DB: createAuditLog user.password_reset
        Auth-->>API: 200 success true
    end
    
    API-->>Client: Redirect to sign-in
```

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ OAuthAccount : has
    User ||--o{ OrganizationMembership : has
    User ||--o{ AuditLog : generates
    User ||--o{ EmailVerificationToken : has
    User ||--o{ PasswordResetToken : has
    User ||--o{ MagicLink : has
    User ||--o{ Passkey : has
    
    Organization ||--o{ OrganizationMembership : has
    Organization ||--o{ OrganizationInvitation : has
    Organization ||--o{ OrganizationRole : has
    
    OrganizationRole ||--o{ OrganizationMembership : assigned_to
    
    Webhook ||--o{ WebhookDelivery : has

    User {
        uuid id PK
        string email UK
        boolean emailVerified
        string passwordHash
        string firstName
        string lastName
        string username UK
        string imageUrl
        boolean mfaEnabled
        string mfaSecret
        array mfaBackupCodes
        datetime lockedUntil
        int failedLoginAttempts
        datetime passwordChangedAt
        datetime lastSignInAt
        json publicMetadata
        json privateMetadata
        json unsafeMetadata
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Session {
        uuid id PK
        uuid userId FK
        string refreshTokenHash UK
        string deviceFingerprint
        string ipAddress
        string userAgent
        string country
        string city
        enum status
        datetime expiresAt
        datetime lastActiveAt
        datetime revokedAt
        datetime createdAt
    }

    OAuthAccount {
        uuid id PK
        uuid userId FK
        enum provider
        string providerAccountId
        string accessToken
        string refreshToken
        datetime accessTokenExpiresAt
        string email
        string name
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    Organization {
        uuid id PK
        string name
        string slug UK
        string imageUrl
        int maxMembers
        array allowedDomains
        json publicMetadata
        json privateMetadata
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    OrganizationMembership {
        uuid id PK
        uuid userId FK
        uuid organizationId FK
        string role
        uuid roleId FK
        array permissions
        datetime createdAt
        datetime updatedAt
    }

    OrganizationRole {
        uuid id PK
        uuid organizationId FK
        string name
        string key
        string description
        array permissions
        boolean isDefault
        datetime createdAt
        datetime updatedAt
    }

    OrganizationInvitation {
        uuid id PK
        string email
        uuid organizationId FK
        string role
        string token UK
        enum status
        datetime expiresAt
        datetime acceptedAt
        uuid invitedById
        datetime createdAt
    }

    EmailVerificationToken {
        uuid id PK
        uuid userId FK
        string token UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    PasswordResetToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    MagicLink {
        uuid id PK
        uuid userId FK
        string email
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        string redirectUrl
        datetime createdAt
    }

    Passkey {
        uuid id PK
        uuid userId FK
        string credentialId UK
        bytes publicKey
        bigint counter
        string deviceType
        boolean backedUp
        array transports
        string name
        datetime createdAt
        datetime lastUsedAt
    }

    AuditLog {
        uuid id PK
        uuid userId FK
        enum actorType
        string action
        string entityType
        string entityId
        string ipAddress
        string userAgent
        string country
        string city
        json metadata
        enum status
        datetime createdAt
    }

    Webhook {
        uuid id PK
        string url
        string secret
        array events
        boolean enabled
        uuid organizationId
        datetime createdAt
        datetime updatedAt
    }

    WebhookDelivery {
        uuid id PK
        uuid webhookId FK
        string eventType
        json payload
        int statusCode
        string responseBody
        string error
        int attempts
        int maxAttempts
        datetime nextRetryAt
        datetime createdAt
        datetime deliveredAt
    }

    ApiKey {
        uuid id PK
        string name
        string keyHash UK
        string keyPrefix
        array scopes
        uuid organizationId
        datetime lastUsedAt
        int usageCount
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }
```

---

## Session and Token Architecture

```mermaid
flowchart TB
    subgraph client [Client Browser]
        AT[Access Token - In Memory]
        RT[Refresh Token - httpOnly Cookie]
    end

    subgraph api [Fastify API]
        MW[Auth Middleware]
        RE[Refresh Endpoint]
    end

    subgraph storage [Storage]
        Redis[(Redis - Session Cache)]
        PG[(PostgreSQL - Sessions Table)]
    end

    AT -->|"Bearer token 15 min expiry"| MW
    MW -->|Verify JWT| MW
    MW -->|Cache hit| Redis
    MW -->|Cache miss| PG

    RT -->|"Rotation on use 7 day expiry"| RE
    RE -->|Validate hash| PG
    RE -->|Issue new tokens| client
    RE -->|Update cache| Redis
```

---

## Rate Limiting Architecture

```mermaid
flowchart LR
    subgraph request [Incoming Request]
        IP[IP Address]
        UID[User ID]
        EMAIL[Email]
    end

    subgraph ratelimit [Rate Limiter]
        KEY[Generate Key - ip:email or userId]
        WINDOW[Sliding Window - Redis Sorted Set]
        CHECK{Count less than Max?}
    end

    subgraph response [Response]
        ALLOW[Allow Request - 200 OK]
        BLOCK[Block Request - 429 Too Many]
    end

    IP --> KEY
    UID --> KEY
    EMAIL --> KEY
    KEY --> WINDOW
    WINDOW --> CHECK
    CHECK -->|Yes| ALLOW
    CHECK -->|No| BLOCK

    subgraph limits [Rate Limits]
        L1["sign-in: 5 per 15min"]
        L2["sign-up: 10 per hour"]
        L3["magic-link: 3 per hour"]
        L4["api: 100 per min"]
    end
```

---

## Webhook Delivery System

```mermaid
flowchart TB
    subgraph events [Auth Events]
        E1[user.created]
        E2[user.signed_in]
        E3[user.deleted]
        E4[session.revoked]
        E5[org.member_added]
    end

    subgraph queue [Event Queue]
        Redis[(Redis Queue)]
    end

    subgraph worker [Webhook Worker]
        PROCESS[Process Event]
        MATCH[Match Subscriptions]
        SIGN[Sign Payload - HMAC-SHA256]
        DELIVER[HTTP POST]
    end

    subgraph retry [Retry Logic]
        CHECK{Success?}
        RETRY[Exponential Backoff - 3 attempts max]
        LOG[Log to DB]
    end

    subgraph destinations [Client Webhooks]
        WH1[https://app1.com/webhook]
        WH2[https://app2.com/webhook]
    end

    E1 & E2 & E3 & E4 & E5 --> Redis
    Redis --> PROCESS
    PROCESS --> MATCH
    MATCH --> SIGN
    SIGN --> DELIVER
    DELIVER --> CHECK
    CHECK -->|No| RETRY
    RETRY --> DELIVER
    CHECK -->|Yes| LOG
    DELIVER --> WH1 & WH2
```

---

## Multi-Tenancy Model

```mermaid
flowchart TB
    subgraph users [Users]
        U1[User A]
        U2[User B]
        U3[User C]
    end

    subgraph orgs [Organizations]
        O1[Acme Inc]
        O2[TechCorp]
    end

    subgraph roles [Roles]
        R1[Owner]
        R2[Admin]
        R3[Member]
        R4[Custom: Editor]
    end

    U1 -->|owner| O1
    U1 -->|admin| O2
    U2 -->|member| O1
    U2 -->|owner| O2
    U3 -->|editor| O1

    subgraph permissions [Permission Check]
        JWT[JWT Token - includes orgId and role]
        CHECK{Has Permission?}
        ALLOW[Allow Action]
        DENY[403 Forbidden]
    end

    JWT --> CHECK
    CHECK -->|Yes| ALLOW
    CHECK -->|No| DENY
```

---

## Usage Notes

These diagrams are written in **Mermaid** format and can be rendered in:

- GitHub README files
- GitBook / Docusaurus documentation
- Notion
- VS Code with Mermaid extension
- https://mermaid.live for quick preview

For the **bastionauth.dev** documentation site, these diagrams provide: