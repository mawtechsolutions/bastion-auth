import { useCallback, useState } from 'react';

import type { User } from '@bastionauth/core';

import { useBastionContext } from '../context/BastionProvider.js';

export function useUser() {
  const { isLoaded, isSignedIn, user, client, _setUser } = useBastionContext();
  const [isUpdating, setIsUpdating] = useState(false);

  const update = useCallback(
    async (data: Partial<User>) => {
      if (!user) throw new Error('No user signed in');

      setIsUpdating(true);
      try {
        const result = await client.updateUser(data);
        _setUser(result.user);
        return result.user;
      } finally {
        setIsUpdating(false);
      }
    },
    [user, client, _setUser]
  );

  return {
    isLoaded,
    isSignedIn,
    user,
    update,
    isUpdating,
  };
}

