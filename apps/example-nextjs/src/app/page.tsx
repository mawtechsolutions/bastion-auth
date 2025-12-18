import Link from 'next/link';

import { auth, currentUser } from '@bastionauth/nextjs/server';

import { Header } from '@/components/Header';

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
            🏰 BastionAuth
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
            Authentication, fortified.
          </p>

          {userId ? (
            <div className="card" style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                Welcome back, {user?.firstName || user?.email}!
              </h2>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
                You are signed in and this is your protected dashboard.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link href="/settings" className="btn btn-outline">
                  Settings
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/sign-in" className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn btn-outline">
                Create account
              </Link>
            </div>
          )}

          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Features</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <FeatureCard
                title="Complete Auth"
                description="Email/password, OAuth, magic links, passkeys"
              />
              <FeatureCard
                title="Multi-Factor Auth"
                description="TOTP, backup codes, and more"
              />
              <FeatureCard
                title="Organizations"
                description="Multi-tenancy with RBAC"
              />
              <FeatureCard
                title="Enterprise Ready"
                description="Webhooks, audit logs, API keys"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
        {description}
      </p>
    </div>
  );
}

