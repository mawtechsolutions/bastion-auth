'use client';

import { useEffect, useState } from 'react';
import { SignIn } from '@bastionauth/nextjs';

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #09090B 0%, #1a1a2e 50%, #16213e 100%)',
    }}>
      {mounted ? (
        <SignIn
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      ) : (
        <div style={{ 
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.875rem'
        }}>
          Loading...
        </div>
      )}
    </div>
  );
}
