# BastionAuth SDK Integration Guide

## Overview

BastionAuth provides official SDKs for seamless integration with your applications:

- `@bastionauth/react` - React SDK with hooks and components
- `@bastionauth/nextjs` - Next.js integration with middleware and server utilities

## Installation

```bash
# For React applications
npm install @bastionauth/react

# For Next.js applications
npm install @bastionauth/nextjs

# Using pnpm
pnpm add @bastionauth/react
pnpm add @bastionauth/nextjs
```

---

## React SDK

### Setup

Wrap your application with `BastionProvider`:

```tsx
// app.tsx or main.tsx
import { BastionProvider } from '@bastionauth/react';

function App() {
  return (
    <BastionProvider
      publishableKey="pk_live_..."
      apiUrl="https://api.bastionauth.dev"
    >
      <YourApp />
    </BastionProvider>
  );
}
```

### Configuration Options

```tsx
<BastionProvider
  publishableKey="pk_live_..."
  apiUrl="https://api.bastionauth.dev"
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/onboarding"
>
```

| Option | Type | Description |
|--------|------|-------------|
| `publishableKey` | string | Your publishable API key |
| `apiUrl` | string | BastionAuth API URL |
| `signInUrl` | string | Path to sign-in page |
| `signUpUrl` | string | Path to sign-up page |
| `afterSignInUrl` | string | Redirect after successful sign-in |
| `afterSignUpUrl` | string | Redirect after successful sign-up |

---

### Authentication Hooks

#### useAuth

Access authentication state and methods:

```tsx
import { useAuth } from '@bastionauth/react';

function MyComponent() {
  const { 
    isLoaded,     // true when auth state is loaded
    isSignedIn,   // true if user is signed in
    user,         // current user object
    signOut,      // sign out function
  } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

#### useUser

Access current user data:

```tsx
import { useUser } from '@bastionauth/react';

function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.email}</p>
      <p>Email verified: {user.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### useSession

Access session information:

```tsx
import { useSession } from '@bastionauth/react';

function SessionInfo() {
  const { session, isLoaded } = useSession();

  if (!isLoaded) return null;
  if (!session) return null;

  return (
    <div>
      <p>Session ID: {session.id}</p>
      <p>Expires: {session.expiresAt}</p>
    </div>
  );
}
```

#### useSignIn

Access sign-in methods:

```tsx
import { useSignIn } from '@bastionauth/react';

function CustomSignIn() {
  const { signIn, isLoading } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn.create({
        identifier: email,
        password,
      });
      // Redirect or handle success
    } catch (err) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button type="submit" disabled={isLoading}>
        Sign In
      </button>
    </form>
  );
}
```

#### useSignUp

Access sign-up methods:

```tsx
import { useSignUp } from '@bastionauth/react';

function CustomSignUp() {
  const { signUp, isLoading } = useSignUp();

  const handleSubmit = async (formData) => {
    try {
      await signUp.create({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      // Handle success (e.g., email verification)
    } catch (err) {
      // Handle error
    }
  };

  // ... form implementation
}
```

---

### Pre-built Components

#### SignIn Component

```tsx
import { SignIn } from '@bastionauth/react';

function SignInPage() {
  return (
    <SignIn 
      redirectUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
        },
      }}
    />
  );
}
```

#### SignUp Component

```tsx
import { SignUp } from '@bastionauth/react';

function SignUpPage() {
  return (
    <SignUp 
      redirectUrl="/onboarding"
      appearance={{
        elements: {
          card: 'bg-white shadow-lg rounded-xl',
        },
      }}
    />
  );
}
```

#### UserButton Component

```tsx
import { UserButton } from '@bastionauth/react';

function Header() {
  return (
    <header>
      <nav>
        {/* ... */}
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  );
}
```

---

### Protected Routes

```tsx
import { useAuth } from '@bastionauth/react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return children;
}

// Usage
function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

---

## Next.js SDK

### App Router Setup

```tsx
// app/layout.tsx
import { BastionProvider } from '@bastionauth/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BastionProvider>
          {children}
        </BastionProvider>
      </body>
    </html>
  );
}
```

### Middleware Configuration

```tsx
// middleware.ts
import { authMiddleware } from '@bastionauth/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up', '/about'],
  ignoredRoutes: ['/api/public'],
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

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
    </div>
  );
}
```

### Server Actions

```tsx
// app/actions.ts
'use server';

import { auth } from '@bastionauth/nextjs/server';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Update user profile
}
```

### API Routes

```tsx
// app/api/protected/route.ts
import { auth } from '@bastionauth/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ message: 'Protected data' });
}
```

### Route Handlers with Organizations

```tsx
// app/api/org-data/route.ts
import { auth } from '@bastionauth/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check org permissions
  if (orgRole !== 'admin' && orgRole !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ data: 'Organization data' });
}
```

---

## Environment Variables

### Required Variables

```env
# .env.local
NEXT_PUBLIC_BASTION_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_BASTION_API_URL=https://api.bastionauth.dev
```

### Optional Variables

```env
# Redirect URLs
NEXT_PUBLIC_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SIGN_OUT_REDIRECT_URL=/
```

---

## TypeScript Support

Both SDKs are fully typed. Import types as needed:

```tsx
import type { 
  User, 
  Session, 
  Organization,
  AuthState 
} from '@bastionauth/react';

interface UserProfileProps {
  user: User;
}
```

---

## Error Handling

```tsx
import { useSignIn } from '@bastionauth/react';

function SignIn() {
  const { signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn.create({ /* ... */ });
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password');
      } else if (err.code === 'ACCOUNT_LOCKED') {
        setError('Account is locked. Please try again later.');
      } else if (err.code === 'RATE_LIMITED') {
        setError('Too many attempts. Please wait a moment.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

---

## Customization

### Appearance Customization

```tsx
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorInputBackground: '#f3f4f6',
      borderRadius: '0.5rem',
    },
    elements: {
      card: 'shadow-xl',
      headerTitle: 'text-2xl font-bold',
      formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
    },
  }}
/>
```

### Custom OAuth Buttons

```tsx
import { useSignIn } from '@bastionauth/react';

function OAuthButtons() {
  const { signIn } = useSignIn();

  return (
    <div className="flex gap-4">
      <button 
        onClick={() => signIn.authenticateWithOAuth('google')}
        className="oauth-button"
      >
        <GoogleIcon /> Sign in with Google
      </button>
      <button 
        onClick={() => signIn.authenticateWithOAuth('github')}
        className="oauth-button"
      >
        <GitHubIcon /> Sign in with GitHub
      </button>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

1. **"BastionProvider must be used at the root of your app"**
   - Ensure BastionProvider wraps your entire application
   - Check that you're not using hooks outside the provider

2. **"Invalid publishable key"**
   - Verify the key is correct and starts with `pk_`
   - Ensure environment variables are loaded

3. **"Token refresh failed"**
   - Check that cookies are enabled
   - Verify API URL is correct
   - Check for CORS issues

4. **Middleware not protecting routes**
   - Verify middleware.ts is in the correct location
   - Check matcher configuration
   - Ensure publicRoutes array is correct

### Debug Mode

Enable debug logging:

```tsx
<BastionProvider
  debug={process.env.NODE_ENV === 'development'}
>
```

This will log authentication state changes and API calls to the console.


