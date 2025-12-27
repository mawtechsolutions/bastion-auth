'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@mawtech/glass-ui';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Check if user is admin
      if (!data.user?.publicMetadata?.role || data.user.publicMetadata.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store token in cookie for middleware
      if (data.accessToken) {
        document.cookie = `__session=${data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `bastionauth_token=${data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
      }

      // Redirect to dashboard or original destination
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-content">
        <div className="sign-in-header">
          <ShieldLogo />
          <h1>BastionAuth Admin</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        <GlassCard variant="glow" padding="lg">
          <form onSubmit={handleSubmit} className="sign-in-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bastionauth.dev"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </GlassCard>

        <p className="sign-in-footer">
          Only administrators can access this dashboard.
        </p>
      </div>

      <style jsx>{`
        .sign-in-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #0A0E14;
        }

        .sign-in-content {
          width: 100%;
          max-width: 400px;
        }

        .sign-in-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .sign-in-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #F8FAFC;
          margin: 1rem 0 0.5rem;
        }

        .sign-in-header p {
          font-size: 0.9375rem;
          color: rgba(248, 250, 252, 0.6);
        }

        .sign-in-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(248, 250, 252, 0.8);
        }

        .form-group input {
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 8px;
          color: #F8FAFC;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #00F0FF;
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
        }

        .form-group input::placeholder {
          color: rgba(248, 250, 252, 0.3);
        }

        .btn-primary {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #00F0FF, #0EA5E9);
          border: none;
          border-radius: 8px;
          color: #0D1117;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #F87171;
          font-size: 0.875rem;
        }

        .sign-in-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }
      `}</style>
    </div>
  );
}

function ShieldLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M20 2L4 8v10c0 9.55 6.83 18.48 16 20 9.17-1.52 16-10.45 16-20V8L20 2z"
        fill="url(#shieldGrad)"
        opacity="0.2"
      />
      <path
        d="M20 2L4 8v10c0 9.55 6.83 18.48 16 20 9.17-1.52 16-10.45 16-20V8L20 2z"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M15 19l3 3 7-7"
        stroke="#00F0FF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

