import { useBastionContext } from '../context/BastionProvider.js';

export function useOrganization() {
  const { isLoaded, organization, setActive } = useBastionContext();

  return {
    isLoaded,
    organization,
    setActive,
  };
}

