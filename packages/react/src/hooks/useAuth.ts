import { useBastionContext } from '../context/BastionProvider.js';

export function useAuth() {
  const { isLoaded, isSignedIn, user, session, signOut, getToken } = useBastionContext();

  return {
    isLoaded,
    isSignedIn,
    userId: user?.id ?? null,
    sessionId: session?.id ?? null,
    signOut,
    getToken,
  };
}

