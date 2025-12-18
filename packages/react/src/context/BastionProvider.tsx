import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Organization, Session, User } from '@bastionauth/core';

import { BastionClient } from '../api/client.js';

interface BastionContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  setActive: (params: { organizationId?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  client: BastionClient;
  // Internal methods for hooks
  _setUser: (user: User | null) => void;
  _setSession: (session: Session | null) => void;
}

const BastionContext = createContext<BastionContextValue | null>(null);

export interface BastionProviderProps {
  children: React.ReactNode;
  publishableKey: string;
  apiUrl?: string;
  appearance?: {
    baseTheme?: 'glass' | 'light' | 'dark';
    variables?: Record<string, string>;
  };
}

export function BastionProvider({
  children,
  publishableKey,
  apiUrl = 'https://api.bastionauth.dev',
  appearance,
}: BastionProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const client = useMemo(
    () => new BastionClient({ publishableKey, apiUrl }),
    [publishableKey, apiUrl]
  );

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const { user: loadedUser, session: loadedSession } = await client.getSession();
        setUser(loadedUser);
        setSession(loadedSession);
      } catch {
        setUser(null);
        setSession(null);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSession();
  }, [client]);

  const signOut = useCallback(async () => {
    await client.signOut();
    setUser(null);
    setSession(null);
    setOrganization(null);
  }, [client]);

  const getToken = useCallback(async () => {
    return client.getToken();
  }, [client]);

  const setActive = useCallback(
    async ({ organizationId }: { organizationId?: string }) => {
      if (organizationId) {
        try {
          const org = await client.getOrganization(organizationId);
          setOrganization(org);
        } catch (error) {
          console.error('Failed to set active organization:', error);
          throw error;
        }
      } else {
        setOrganization(null);
      }
    },
    [client]
  );

  const value: BastionContextValue = useMemo(
    () => ({
      isLoaded,
      isSignedIn: !!user,
      user,
      session,
      organization,
      setActive,
      signOut,
      getToken,
      client,
      _setUser: setUser,
      _setSession: setSession,
    }),
    [isLoaded, user, session, organization, setActive, signOut, getToken, client]
  );

  // Apply appearance CSS variables
  useEffect(() => {
    if (appearance?.variables) {
      const root = document.documentElement;
      Object.entries(appearance.variables).forEach(([key, value]) => {
        root.style.setProperty(`--bastion-${key}`, value);
      });
    }
  }, [appearance]);

  return (
    <BastionContext.Provider value={value}>
      {children}
    </BastionContext.Provider>
  );
}

export function useBastionContext(): BastionContextValue {
  const context = useContext(BastionContext);
  if (!context) {
    throw new Error('useBastionContext must be used within a BastionProvider');
  }
  return context;
}

