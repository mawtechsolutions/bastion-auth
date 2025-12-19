'use client';

// Context & Provider
export { BastionProvider } from './context/BastionProvider.js';
export type { BastionProviderProps } from './context/BastionProvider.js';

// Hooks
export { useAuth } from './hooks/useAuth.js';
export { useUser } from './hooks/useUser.js';
export { useSession } from './hooks/useSession.js';
export { useOrganization } from './hooks/useOrganization.js';
export { useOrganizationList } from './hooks/useOrganizationList.js';
export { useSignIn } from './hooks/useSignIn.js';
export { useSignUp } from './hooks/useSignUp.js';

// Components
export { SignIn } from './components/SignIn/index.js';
export { SignUp } from './components/SignUp/index.js';
export { UserButton } from './components/UserButton/index.js';
export { ProtectedRoute } from './components/ProtectedRoute.js';
export { RedirectToSignIn } from './components/RedirectToSignIn.js';

// Logo Components
export { BastionAuthLogo, BastionAuthIcon, BastionAuthColors } from './assets/logo.js';

// API Client
export { BastionClient } from './api/client.js';
export type { BastionClientConfig } from './api/client.js';

// Re-export types from core
export type {
  User,
  Session,
  Organization,
  OrganizationMembership,
  TokenPair,
} from '@bastionauth/core';

