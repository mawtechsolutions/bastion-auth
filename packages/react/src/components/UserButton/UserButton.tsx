import React, { useEffect, useRef, useState } from 'react';

import { getDisplayName, getInitials } from '@bastionauth/core';

import { useAuth } from '../../hooks/useAuth.js';
import { useOrganization } from '../../hooks/useOrganization.js';
import { useUser } from '../../hooks/useUser.js';

import './UserButton.css';

export interface UserButtonProps {
  afterSignOutUrl?: string;
  appearance?: Record<string, string>;
  showName?: boolean;
  userProfileUrl?: string;
}

export function UserButton({
  afterSignOutUrl = '/',
  showName = false,
  userProfileUrl = '/user/profile',
}: UserButtonProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = afterSignOutUrl;
  };

  return (
    <div className="bastion-user-button" ref={menuRef}>
      <button
        className="bastion-user-button__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="bastion-avatar">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="bastion-avatar__image"
            />
          ) : (
            <span className="bastion-avatar__fallback">{initials}</span>
          )}
        </div>
        {showName && (
          <span className="bastion-user-button__name">{displayName}</span>
        )}
      </button>

      {isOpen && (
        <div className="bastion-user-button__menu" role="menu">
          <div className="bastion-user-button__header">
            <div className="bastion-avatar bastion-avatar--lg">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  className="bastion-avatar__image"
                />
              ) : (
                <span className="bastion-avatar__fallback">{initials}</span>
              )}
            </div>
            <div className="bastion-user-button__info">
              <p className="bastion-user-button__display-name">{displayName}</p>
              <p className="bastion-user-button__email">{user.email}</p>
            </div>
          </div>

          {organization && (
            <div className="bastion-user-button__org">
              <span>Active organization:</span>
              <strong>{organization.name}</strong>
            </div>
          )}

          <nav className="bastion-user-button__nav">
            <a href={userProfileUrl} className="bastion-user-button__nav-item">
              <ManageAccountIcon />
              <span>Manage account</span>
            </a>
            <a href="/user/security" className="bastion-user-button__nav-item">
              <SecurityIcon />
              <span>Security</span>
            </a>
          </nav>

          <div className="bastion-user-button__footer">
            <button
              onClick={handleSignOut}
              className="bastion-user-button__sign-out"
            >
              <SignOutIcon />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageAccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a2 2 0 00-2 2v4H5a2 2 0 00-2 2v5a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H7V3a1 1 0 012 0v1h1V3a2 2 0 00-2-2z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"
      />
      <path
        fillRule="evenodd"
        d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"
      />
    </svg>
  );
}

