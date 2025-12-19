// Re-export client-safe components from React SDK
export { 
  BastionProvider,
  useAuth,
  useUser,
  useSession,
  useOrganization,
  useOrganizationList,
  useSignIn,
  useSignUp,
  SignIn,
  SignUp,
  UserButton,
  ProtectedRoute,
  RedirectToSignIn,
} from '@bastionauth/react';

// Re-export types from React SDK
export type {
  User,
  Session,
  Organization,
  OrganizationMembership,
  TokenPair,
} from '@bastionauth/react';

// Export Next.js middleware (edge runtime compatible)
export { authMiddleware, type AuthMiddlewareOptions } from './middleware.js';
