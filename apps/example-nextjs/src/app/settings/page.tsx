import { redirect } from 'next/navigation';

import { auth, currentUser } from '@bastionauth/nextjs/server';

import { Header } from '@/components/Header';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
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
          Settings
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
          Manage your account settings
        </p>

        <div style={{ maxWidth: '600px' }}>
          <SettingsForm user={user} />
        </div>
      </main>
    </>
  );
}

