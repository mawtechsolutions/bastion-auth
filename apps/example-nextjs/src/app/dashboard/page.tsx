import { redirect } from 'next/navigation';

import { auth, currentUser } from '@bastionauth/nextjs/server';

import { Header } from '@/components/Header';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
          Welcome to your protected dashboard!
        </p>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>User Info</h2>
          <pre style={{
            background: 'var(--muted)',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            overflow: 'auto',
            fontSize: '0.875rem',
          }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </main>
    </>
  );
}

