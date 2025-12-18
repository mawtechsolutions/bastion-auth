import { useCallback, useState } from 'react';

import type { SignUpRequest, User } from '@bastionauth/core';

import { useBastionContext } from '../context/BastionProvider.js';

export function useSignUp() {
  const { client, _setUser } = useBastionContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signUp = useCallback(
    async (data: SignUpRequest): Promise<{ user: User }> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await client.signUp(data);
        _setUser(result.user);
        return { user: result.user };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sign up failed');
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
    signUp,
  };
}

