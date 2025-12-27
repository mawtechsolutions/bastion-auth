'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Header } from '@/components/Header';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isAutoSlug, setIsAutoSlug] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (isAutoSlug) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoSlug(false);
    setSlug(generateSlug(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          slug: slug || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create organization');
      }

      const data = await response.json();
      router.push(`/organizations/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '2rem', maxWidth: '600px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link 
            href="/organizations" 
            style={{ 
              color: 'var(--muted-foreground)', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Organizations
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            Create Organization
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Set up a new organization for your team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius)',
              color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="name" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 500 
              }}
            >
              Organization Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="My Organization"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="slug" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 500 
              }}
            >
              Organization Slug
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }}>
                /
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="my-organization"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 1.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: '1rem',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)' 
            }}>
              {slug ? `Your organization URL: /organizations/${slug}` : 'Auto-generated from name'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link 
              href="/organizations"
              className="btn"
              style={{
                background: 'var(--muted)',
                color: 'var(--foreground)',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

