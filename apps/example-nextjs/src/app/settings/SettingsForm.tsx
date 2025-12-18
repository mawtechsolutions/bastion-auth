'use client';

import { useState } from 'react';

import { useUser } from '@bastionauth/nextjs';
import type { User } from '@bastionauth/core';

export function SettingsForm({ user: initialUser }: { user: User | null }) {
  const { user, update, isUpdating } = useUser();
  const currentUser = user || initialUser;

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    try {
      await update({ firstName, lastName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
        Profile
      </h2>

      {success && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '0.75rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1rem',
        }}>
          Profile updated successfully!
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>
          Email
        </label>
        <input
          type="email"
          value={currentUser?.email || ''}
          disabled
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--muted)',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
          Email cannot be changed
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500 }}>
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isUpdating}
        className="btn btn-primary"
      >
        {isUpdating ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}

