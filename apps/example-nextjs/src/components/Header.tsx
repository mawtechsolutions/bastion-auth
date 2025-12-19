'use client';

import Link from 'next/link';

import { UserButton, useAuth } from '@bastionauth/nextjs';

export function Header() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '0.75rem 0',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'inherit',
          fontWeight: 600,
        }}>
          <img 
            src="/logos/bastion-logo-nobg.png" 
            alt="BastionAuth" 
            width={160}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLoaded && (
            isSignedIn ? (
              <>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-outline">
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn btn-primary">
                  Get started
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

