import React, { useState } from 'react';

import { useSignUp } from '../../hooks/useSignUp.js';

import '../SignIn/SignIn.css';

export interface SignUpProps {
  routing?: 'path' | 'hash' | 'virtual';
  path?: string;
  signInUrl?: string;
  afterSignUpUrl?: string;
  appearance?: {
    elements?: Record<string, React.CSSProperties>;
    variables?: Record<string, string>;
  };
}

export function SignUp({
  signInUrl = '/sign-in',
  afterSignUpUrl = '/',
  appearance,
}: SignUpProps) {
  const { signUp, isLoading, error } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      const result = await signUp({ email, password, firstName, lastName });
      if (result.user) {
        window.location.href = afterSignUpUrl;
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  const displayError = localError || (error?.message ?? null);

  return (
    <div className="bastion-sign-in" style={appearance?.elements?.card}>
      <div className="bastion-sign-in__header">
        <h1 className="bastion-sign-in__title">Create an account</h1>
        <p className="bastion-sign-in__subtitle">
          Get started with BastionAuth today.
        </p>
      </div>

      {displayError && (
        <div className="bastion-alert bastion-alert--error">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bastion-form">
        <div className="bastion-form-row">
          <div className="bastion-form-field">
            <label htmlFor="firstName" className="bastion-label">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="bastion-input"
              placeholder="John"
            />
          </div>

          <div className="bastion-form-field">
            <label htmlFor="lastName" className="bastion-label">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="bastion-input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="bastion-form-field">
          <label htmlFor="email" className="bastion-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bastion-input"
            placeholder="you@example.com"
          />
        </div>

        <div className="bastion-form-field">
          <label htmlFor="password" className="bastion-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="bastion-input"
            placeholder="••••••••"
          />
          <p className="bastion-hint">Minimum 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="bastion-button bastion-button--primary"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="bastion-sign-in__footer">
        <p>
          Already have an account?{' '}
          <a href={signInUrl} className="bastion-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

