import React from 'react';

import { useAuth } from '../hooks/useAuth.js';

import { RedirectToSignIn } from './RedirectToSignIn.js';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}

