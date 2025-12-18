import { useCallback, useEffect, useState } from 'react';

import type { Organization } from '@bastionauth/core';

import { useBastionContext } from '../context/BastionProvider.js';

export function useOrganizationList() {
  const { isLoaded, isSignedIn, client, setActive } = useBastionContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!isSignedIn) {
        setOrganizations([]);
        setIsLoading(false);
        return;
      }

      try {
        const result = await client.getOrganizations();
        setOrganizations(result.organizations);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchOrganizations();
    }
  }, [isLoaded, isSignedIn, client]);

  const createOrganization = useCallback(
    async (data: { name: string; slug?: string }) => {
      const response = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await client.getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      const result = await response.json();
      setOrganizations((prev) => [...prev, result.organization]);
      return result.organization;
    },
    [client]
  );

  return {
    isLoaded: isLoaded && !isLoading,
    organizations,
    setActive,
    createOrganization,
  };
}

