'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/Header';

interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/v1/organizations`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/sign-in');
            return;
          }
          throw new Error('Failed to fetch organizations');
        }
        
        const data = await response.json();
        setOrganizations(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [router]);

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem' 
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
              Organizations
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              Manage your organizations and teams
            </p>
          </div>
          <Link href="/organizations/new" className="btn btn-primary">
            Create Organization
          </Link>
        </div>

        {isLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Loading organizations...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', borderColor: '#ef4444' }}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No organizations yet</h3>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Create your first organization to get started
            </p>
            <Link href="/organizations/new" className="btn btn-primary">
              Create Organization
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem' 
          }}>
            {organizations.map((org) => (
              <Link 
                key={org.id} 
                href={`/organizations/${org.slug}`}
                className="card"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                  }}>
                    {org.imageUrl ? (
                      <img 
                        src={org.imageUrl} 
                        alt={org.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: 'var(--radius)' 
                        }} 
                      />
                    ) : (
                      org.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{org.name}</h3>
                    <p style={{ 
                      color: 'var(--muted-foreground)', 
                      fontSize: '0.875rem' 
                    }}>
                      /{org.slug}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

