import React, { useState } from 'react';

import { useSignIn } from '../../hooks/useSignIn.js';

import { OAuthButtons } from './OAuthButtons.js';
import { SignInForm } from './SignInForm.js';

import './SignIn.css';

export interface SignInProps {
  routing?: 'path' | 'hash' | 'virtual';
  path?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  redirectUrl?: string;
  appearance?: {
    elements?: Record<string, React.CSSProperties>;
    variables?: Record<string, string>;
  };
}

export function SignIn({
  signUpUrl = '/sign-up',
  afterSignInUrl = '/',
  appearance,
}: SignInProps) {
  const { signIn, verifyMfa, isLoading, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (mfaRequired && mfaChallengeId) {
        const result = await verifyMfa(mfaChallengeId, mfaCode, 'totp');
        if (result.user) {
          window.location.href = afterSignInUrl;
        }
        return;
      }

      const result = await signIn({ email, password });

      if (result.requiresMfa) {
        setMfaRequired(true);
        setMfaChallengeId(result.mfaChallengeId || null);
      } else if (result.user) {
        window.location.href = afterSignInUrl;
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const displayError = localError || (error?.message ?? null);

  return (
    <div className="bastion-sign-in" style={appearance?.elements?.card}>
      <div className="bastion-sign-in__header">
        <h1 className="bastion-sign-in__title">Sign in</h1>
        <p className="bastion-sign-in__subtitle">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      {displayError && (
        <div className="bastion-alert bastion-alert--error">
          {displayError}
        </div>
      )}

      {!mfaRequired && <OAuthButtons mode="sign-in" />}

      {!mfaRequired && (
        <div className="bastion-divider">
          <span>or</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bastion-form">
        {!mfaRequired ? (
          <SignInForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
          />
        ) : (
          <div className="bastion-mfa">
            <p className="bastion-mfa__description">
              Enter the 6-digit code from your authenticator app.
            </p>
            <div className="bastion-form-field">
              <label htmlFor="mfa-code" className="bastion-label">
                Authentication code
              </label>
              <input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                autoComplete="one-time-code"
                className="bastion-input"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || mfaCode.length !== 6}
              className="bastion-button bastion-button--primary"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}
      </form>

      <div className="bastion-sign-in__footer">
        <p>
          Don't have an account?{' '}
          <a href={signUpUrl} className="bastion-link">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

