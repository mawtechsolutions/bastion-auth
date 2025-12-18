import { useCallback, useState } from 'react';

import type { SignInRequest } from '@bastionauth/core';

import { useBastionContext } from '../context/BastionProvider.js';

interface SignInResult {
  user?: { id: string; email: string };
  requiresMfa?: boolean;
  mfaChallengeId?: string;
  supportedMethods?: ('totp' | 'backup_code')[];
}

export function useSignIn() {
  const { client, _setUser, _setSession } = useBastionContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(
    async (data: SignInRequest): Promise<SignInResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.signIn(data);

        if ('requiresMfa' in result) {
          return {
            requiresMfa: true,
            mfaChallengeId: result.mfaChallengeId,
            supportedMethods: result.supportedMethods,
          };
        }

        _setUser(result.user);
        return { user: result.user };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign in failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, _setUser]
  );

  const verifyMfa = useCallback(
    async (
      mfaChallengeId: string,
      code: string,
      method: 'totp' | 'backup_code'
    ): Promise<SignInResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.verifyMfa(mfaChallengeId, code, method);
        _setUser(result.user);
        return { user: result.user };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('MFA verification failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, _setUser]
  );

  return {
    isLoaded: true,
    isLoading,
    error,
    signIn,
    verifyMfa,
  };
}

