'use client';

import { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '@mawtech/glass-ui';
import '@mawtech/glass-ui/styles.css';

import { BastionAuthLogo } from '../../assets/logo.js';
import { useSignIn } from '../../hooks/useSignIn.js';

const OAUTH_PROVIDERS = [
  { id: 'google', name: 'Google', icon: GoogleIcon },
  { id: 'github', name: 'GitHub', icon: GitHubIcon },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export interface SignInProps {
  signUpUrl?: string;
  forgotPasswordUrl?: string;
  afterSignInUrl?: string;
  routing?: 'path' | 'hash' | 'virtual';
  providers?: ('google' | 'github' | 'apple' | 'microsoft' | 'discord' | 'twitter')[];
  showOAuth?: boolean;
  appearance?: {
    accentColor?: string;
  };
}

export function SignIn({
  signUpUrl = '/sign-up',
  forgotPasswordUrl = '/forgot-password',
  afterSignInUrl = '/dashboard',
  providers = ['google', 'github'],
  showOAuth = true,
}: SignInProps) {
  const { signIn, isLoading, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [, setMfaChallengeId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await signIn({ email, password });

      if (result.requiresMfa) {
        setShowMfa(true);
        setMfaChallengeId(result.mfaChallengeId || null);
      } else {
        window.location.href = afterSignInUrl;
      }
    } catch {
      // Error is handled by useSignIn
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const filteredProviders = OAUTH_PROVIDERS.filter(p => 
    providers.includes(p.id as typeof providers[number])
  );

  if (showMfa) {
    return (
      <div className="bastion-signin-container">
        <GlassCard variant="glow" padding="lg" className="bastion-signin-card">
          <div className="bastion-signin-header">
            <BastionAuthLogo width={180} height={45} />
            <h1>Two-Factor Authentication</h1>
            <p>Enter the code from your authenticator app</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            // Handle MFA verification
          }}>
            <GlassInput
              label="Authentication Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              autoFocus
            />

            <GlassButton 
              type="submit" 
              variant="primary" 
              fullWidth
              loading={isLoading}
            >
              Verify
            </GlassButton>
          </form>

          <GlassButton 
            variant="ghost" 
            fullWidth
            onClick={() => setShowMfa(false)}
          >
            ← Back to sign in
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="bastion-signin-container">
      <GlassCard variant="glow" padding="lg" className="bastion-signin-card">
        <div className="bastion-signin-header">
          <BastionAuthLogo width={180} height={45} />
          <h1>Sign in</h1>
          <p>Welcome back! Please sign in to continue.</p>
        </div>

        {showOAuth && filteredProviders.length > 0 && (
          <>
            <div className="bastion-oauth-buttons">
              {filteredProviders.map(provider => (
                <GlassButton
                  key={provider.id}
                  variant="secondary"
                  onClick={() => handleOAuth(provider.id)}
                  fullWidth
                >
                  <provider.icon />
                  <span>Continue with {provider.name}</span>
                </GlassButton>
              ))}
            </div>

            <div className="bastion-divider">
              <span>or</span>
            </div>
          </>
        )}

        {error && (
          <div className="bastion-error">
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <GlassInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <GlassInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="bastion-forgot-password">
            <a href={forgotPasswordUrl}>Forgot password?</a>
          </div>

          <GlassButton 
            type="submit" 
            variant="primary" 
            fullWidth
            loading={isLoading}
          >
            Sign in
          </GlassButton>
        </form>

        <div className="bastion-signup-link">
          Don't have an account? <a href={signUpUrl}>Sign up</a>
        </div>
      </GlassCard>

      <style>{`
        .bastion-signin-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, #09090B 0%, #1a1a2e 50%, #16213e 100%);
        }

        .bastion-signin-card {
          width: 100%;
          max-width: 400px;
        }

        .bastion-signin-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .bastion-signin-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 1rem 0 0.5rem;
        }

        .bastion-signin-header p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .bastion-oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .bastion-oauth-buttons button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .bastion-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
        }

        .bastion-divider::before,
        .bastion-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .bastion-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .bastion-forgot-password {
          text-align: right;
          margin-bottom: 1rem;
        }

        .bastion-forgot-password a {
          color: #00F0FF;
          font-size: 0.875rem;
          text-decoration: none;
        }

        .bastion-forgot-password a:hover {
          text-decoration: underline;
        }

        .bastion-signup-link {
          text-align: center;
          margin-top: 1.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .bastion-signup-link a {
          color: #00F0FF;
          text-decoration: none;
        }

        .bastion-signup-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
