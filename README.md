# 🏰 BastionAuth

> Authentication, fortified.

BastionAuth is a complete, production-ready authentication system that can be self-hosted and used across all your projects. Built with enterprise-grade security and excellent developer experience.

## Features

- 🔐 **Complete Authentication** - Email/password, OAuth, magic links, passkeys
- 🔑 **Multi-Factor Authentication** - TOTP, backup codes, WebAuthn
- 🏢 **Organizations & RBAC** - Multi-tenancy with role-based access control
- 📧 **Email Integration** - Powered by Resend
- 🔒 **Enterprise Security** - Argon2id, RS256 JWT, rate limiting, breach detection
- 🎨 **Beautiful SDK** - React components with glass-ui
- ⚡ **Next.js Integration** - Middleware, server helpers, edge support
- 📊 **Admin Dashboard** - User management, audit logs, webhooks

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

```bash
# Clone the repository
git clone https://github.com/bastionauth/bastionauth.git
cd bastionauth

# Run setup script
./scripts/setup.sh

# Or manually:
pnpm install
pnpm docker:up
pnpm db:generate
pnpm db:migrate

# Start development
pnpm dev
```

## Project Structure

```
bastionauth/
├── packages/
│   ├── core/           # Shared types, constants, utilities
│   ├── server/         # Fastify API server
│   ├── react/          # React SDK
│   ├── nextjs/         # Next.js integration
│   └── admin/          # Admin dashboard
├── apps/
│   └── example-nextjs/ # Example integration
├── docker/             # Docker configuration
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| `@bastionauth/core` | Shared types and utilities | ![npm](https://img.shields.io/npm/v/@bastionauth/core) |
| `@bastionauth/server` | Authentication API server | ![npm](https://img.shields.io/npm/v/@bastionauth/server) |
| `@bastionauth/react` | React SDK | ![npm](https://img.shields.io/npm/v/@bastionauth/react) |
| `@bastionauth/nextjs` | Next.js integration | ![npm](https://img.shields.io/npm/v/@bastionauth/nextjs) |

## Usage

### React SDK

```tsx
import { BastionProvider, SignIn, useAuth } from '@bastionauth/react';

function App() {
  return (
    <BastionProvider publishableKey="pk_...">
      <SignIn />
    </BastionProvider>
  );
}

function Dashboard() {
  const { user, signOut } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
```

### Next.js Middleware

```typescript
import { authMiddleware } from '@bastionauth/nextjs';

export default authMiddleware({
  publicRoutes: ['/sign-in', '/sign-up', '/'],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Server-Side Auth

```typescript
import { auth, currentUser } from '@bastionauth/nextjs/server';

export default async function Page() {
  const { userId } = await auth();
  const user = await currentUser();
  
  return <div>Hello, {user?.firstName}!</div>;
}
```

## Security

BastionAuth implements industry-leading security practices:

- **Password Hashing**: Argon2id (64MB memory, 3 iterations)
- **JWT Signing**: RS256 with 15-minute access tokens
- **Refresh Tokens**: Opaque tokens, hashed storage, 7-day expiry with rotation
- **Rate Limiting**: Sliding window via Redis
- **Breach Detection**: HaveIBeenPwned API integration
- **Encryption**: AES-256-GCM for sensitive data at rest

## Development

```bash
# Start all services in development
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Build all packages
pnpm build

# Database commands
pnpm db:studio    # Open Prisma Studio
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed database
```

## Documentation

### Guides
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Self-Hosting Guide](./docs/guides/self-hosting.md)
- [OAuth Setup](./docs/guides/oauth-setup.md)
- [Next.js Integration](./docs/guides/nextjs-integration.md)

### Reference
- [API Reference](./docs/api/README.md)
- [Architecture & Design](./docs/ARCHITECTURE.md)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│   React App  ←→  @bastionauth/react                         │
│   Next.js    ←→  @bastionauth/nextjs                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Fastify API     │
                    │   @bastionauth/   │
                    │   server          │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │PostgreSQL │       │   Redis   │       │ External  │
    │           │       │           │       │  APIs     │
    │ • Users   │       │ • Sessions│       │ • Resend  │
    │ • Orgs    │       │ • Cache   │       │ • OAuth   │
    │ • Logs    │       │ • Limits  │       │ • HIBP    │
    └───────────┘       └───────────┘       └───────────┘
```

See [Architecture Documentation](./docs/ARCHITECTURE.md) for detailed diagrams and flows.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [BastionAuth](https://bastionauth.dev)

