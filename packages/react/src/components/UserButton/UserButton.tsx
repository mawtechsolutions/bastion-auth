'use client';

import { useEffect, useRef, useState } from 'react';
import '@mawtech/glass-ui/styles.css';

import { useAuth } from '../../hooks/useAuth.js';
import { useUser } from '../../hooks/useUser.js';
import { getDisplayName, getInitials } from '@bastionauth/core';

export interface UserButtonProps {
  afterSignOutUrl?: string;
  userProfileUrl?: string;
  appearance?: {
    avatarSize?: 'sm' | 'md' | 'lg';
  };
}

export function UserButton({
  afterSignOutUrl = '/',
  userProfileUrl = '/user-profile',
  appearance = {},
}: UserButtonProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { avatarSize = 'md' } = appearance;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = afterSignOutUrl;
  };

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <div className="bastion-user-button" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bastion-user-trigger"
        aria-label="User menu"
      >
        {user.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={displayName}
            className="bastion-user-avatar"
            style={{ 
              width: sizeMap[avatarSize], 
              height: sizeMap[avatarSize] 
            }}
          />
        ) : (
          <div 
            className="bastion-user-avatar bastion-user-avatar-placeholder"
            style={{ 
              width: sizeMap[avatarSize], 
              height: sizeMap[avatarSize] 
            }}
          >
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="bastion-user-dropdown">
          <div className="bastion-user-dropdown-header">
            <div className="bastion-user-info">
              {user.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={displayName}
                  className="bastion-user-dropdown-avatar"
                />
              ) : (
                <div className="bastion-user-dropdown-avatar bastion-user-avatar-placeholder">
                  {initials}
                </div>
              )}
              <div className="bastion-user-details">
                <span className="bastion-user-name">{displayName}</span>
                <span className="bastion-user-email">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="bastion-user-dropdown-divider" />

          <div className="bastion-user-dropdown-menu">
            <a href={userProfileUrl} className="bastion-user-menu-item">
              <UserIcon />
              <span>Manage account</span>
            </a>
          </div>

          <div className="bastion-user-dropdown-divider" />

          <div className="bastion-user-dropdown-menu">
            <button 
              onClick={handleSignOut}
              className="bastion-user-menu-item bastion-user-menu-item-danger"
            >
              <SignOutIcon />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bastion-user-button {
          position: relative;
        }

        .bastion-user-trigger {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 50%;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .bastion-user-trigger:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.3);
        }

        .bastion-user-avatar {
          border-radius: 50%;
          object-fit: cover;
        }

        .bastion-user-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2D9E8A 0%, #1E4A7D 100%);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .bastion-user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          z-index: 100;
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bastion-user-dropdown-header {
          padding: 1rem;
        }

        .bastion-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .bastion-user-dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .bastion-user-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .bastion-user-name {
          color: white;
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .bastion-user-email {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8125rem;
        }

        .bastion-user-dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .bastion-user-dropdown-menu {
          padding: 0.5rem;
        }

        .bastion-user-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: none;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bastion-user-menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .bastion-user-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .bastion-user-menu-item svg {
          width: 18px;
          height: 18px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
