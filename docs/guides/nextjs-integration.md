# Next.js Integration Guide

This guide covers integrating BastionAuth with Next.js applications.

## Installation

```bash
npm install @bastionauth/react @bastionauth/nextjs
# or
pnpm add @bastionauth/react @bastionauth/nextjs
# or
yarn add @bastionauth/react @bastionauth/nextjs
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_BASTION_PUBLISHABLE_KEY=pk_test_...
BASTION_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASTION_API_URL=http://localhost:3001
```

## Setup

### 1. Configure Middleware

Create `middleware.ts` in your project root:

```typescript
import { authMiddleware } from '@bastionauth/nextjs';

export default authMiddleware({
  // Routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/public(.*)',
  ],
  
  // Routes that should be ignored completely
  ignoredRoutes: [
    '/api/webhooks(.*)',
    '/_next(.*)',
    '/favicon.ico',
  ],
  
  // Redirect when not signed in
  signInUrl: '/sign-in',
  
  // Redirect after sign in
  afterSignInUrl: '/dashboard',
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### 2. Add Provider to Layout

```tsx
// app/layout.tsx
import { BastionProvider } from '@bastionauth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BastionProvider
          publishableKey={process.env.NEXT_PUBLIC_BASTION_PUBLISHABLE_KEY!}
          apiUrl={process.env.NEXT_PUBLIC_BASTION_API_URL}
        >
          {children}
        </BastionProvider>
      </body>
    </html>
  );
}
```

## Authentication Pages

### Sign In Page

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@bastionauth/react';

export default function SignInPage() {
  return (
    <div className="auth-container">
      <SignIn 
        appearance={{
          theme: 'dark',
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

### Sign Up Page

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@bastionauth/react';

export default function SignUpPage() {
  return (
    <div className="auth-container">
      <SignUp 
        redirectUrl="/dashboard"
        initialValues={{
          firstName: '',
          lastName: '',
        }}
      />
    </div>
  );
}
```

## Server-Side Authentication

### Server Components

```tsx
// app/dashboard/page.tsx
import { auth, currentUser } from '@bastionauth/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const user = await currentUser();
  
  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### Server Actions

```tsx
// app/actions.ts
'use server';

import { auth } from '@bastionauth/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  // Update user profile
  await fetch(`${process.env.BASTION_API_URL}/api/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BASTION_SECRET_KEY}`,
    },
    body: JSON.stringify({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
    }),
  });
  
  revalidatePath('/dashboard');
}
```

### API Routes

```typescript
// app/api/profile/route.ts
import { auth } from '@bastionauth/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Fetch and return user data
  return NextResponse.json({ userId });
}
```

## Client-Side Hooks

### useAuth Hook

```tsx
'use client';

import { useAuth } from '@bastionauth/react';

export function AuthStatus() {
  const { isLoaded, isSignedIn, user, signOut } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <a href="/sign-in">Sign in</a>;
  }
  
  return (
    <div>
      <span>Hello, {user.email}</span>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

### useUser Hook

```tsx
'use client';

import { useUser } from '@bastionauth/react';

export function UserProfile() {
  const { user, isLoaded, updateUser } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Not signed in</div>;
  }
  
  return (
    <div>
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.email}</p>
      {user.mfaEnabled && <span>🔐 MFA Enabled</span>}
    </div>
  );
}
```

### useOrganization Hook

```tsx
'use client';

import { useOrganization, useOrganizationList } from '@bastionauth/react';

export function OrganizationSwitcher() {
  const { organization } = useOrganization();
  const { organizations, setActiveOrganization } = useOrganizationList();
  
  return (
    <select
      value={organization?.id}
      onChange={(e) => setActiveOrganization(e.target.value)}
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
```

## Protected Routes

### Using Middleware

The middleware automatically protects routes. Configure which routes are public:

```typescript
authMiddleware({
  publicRoutes: [
    '/',                    // Home page
    '/about',               // About page
    '/sign-in(.*)',         // Sign in and sub-routes
    '/sign-up(.*)',         // Sign up and sub-routes
    '/api/public(.*)',      // Public API routes
  ],
});
```

### Using ProtectedRoute Component

```tsx
import { ProtectedRoute, RedirectToSignIn } from '@bastionauth/react';

export default function SettingsPage() {
  return (
    <ProtectedRoute fallback={<RedirectToSignIn />}>
      <SettingsContent />
    </ProtectedRoute>
  );
}
```

## Organizations

### Organization Context

```tsx
'use client';

import { useOrganization } from '@bastionauth/react';

export function OrgDashboard() {
  const { organization, membership, isLoaded } = useOrganization();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!organization) return <div>No organization selected</div>;
  
  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Your role: {membership?.role.name}</p>
    </div>
  );
}
```

### Organization-Scoped API Routes

```typescript
// app/api/org/[orgId]/members/route.ts
import { auth, currentOrganization } from '@bastionauth/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { userId, orgId } = await auth();
  const org = await currentOrganization();
  
  if (!userId || !orgId || orgId !== params.orgId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Fetch org members...
}
```

## Customization

### Custom Sign In Page

```tsx
'use client';

import { useSignIn } from '@bastionauth/react';

export function CustomSignIn() {
  const { signIn, isLoading, error } = useSignIn();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await signIn({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      {error && <p className="error">{error.message}</p>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

### Theming

```tsx
<BastionProvider
  appearance={{
    theme: 'dark',
    variables: {
      colorPrimary: '#3b82f6',
      borderRadius: '8px',
    },
  }}
>
  {children}
</BastionProvider>
```

## Webhooks

### Handling Webhooks

```typescript
// app/api/webhooks/bastionauth/route.ts
import { headers } from 'next/headers';
import { Webhook } from '@bastionauth/nextjs/server';

export async function POST(req: Request) {
  const headersList = headers();
  const signature = headersList.get('x-bastion-signature');
  
  const webhook = new Webhook(process.env.WEBHOOK_SECRET!);
  
  try {
    const event = await webhook.verify(
      await req.text(),
      signature!
    );
    
    switch (event.type) {
      case 'user.created':
        // Handle new user
        break;
      case 'session.created':
        // Handle new session
        break;
      case 'organization.member_added':
        // Handle new org member
        break;
    }
    
    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
}
```

## Troubleshooting

### "useAuth must be used within BastionProvider"

Ensure BastionProvider wraps your component:

```tsx
// ❌ Wrong
export default function Page() {
  const { user } = useAuth(); // Error!
}

// ✅ Correct - Provider in layout
```

### Middleware Not Working

Check your matcher configuration:

```typescript
export const config = {
  matcher: [
    // Skip static files
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
```

### Session Not Persisting

Ensure cookies are configured correctly:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};
```

