import { useBastionContext } from '../context/BastionProvider.js';

export function useSession() {
  const { isLoaded, session } = useBastionContext();

  return {
    isLoaded,
    session,
  };
}

