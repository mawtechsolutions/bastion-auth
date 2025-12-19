'use client';

import type { User } from '@bastionauth/core';
import { formatRelativeTime } from '@bastionauth/core';

interface AdminUser extends User {
  hasPassword?: boolean;
  suspendedAt?: Date | null;
  bannedAt?: Date | null;
  oauthAccounts?: Array<{
    provider: string;
    providerAccountId: string;
    createdAt: string;
  }>;
}

interface UserDetailPanelProps {
  user: AdminUser;
}

export function UserDetailPanel({ user }: UserDetailPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>User Details</h2>
      
      <div className="detail-grid">
        <div className="detail-section">
          <h3 className="section-title">Profile</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>First Name</dt>
              <dd>{user.firstName || '—'}</dd>
            </div>
            <div className="detail-item">
              <dt>Last Name</dt>
              <dd>{user.lastName || '—'}</dd>
            </div>
            <div className="detail-item">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="detail-item">
              <dt>Email Verified</dt>
              <dd>
                {user.emailVerified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Unverified</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="detail-section">
          <h3 className="section-title">Security</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>MFA Status</dt>
              <dd>
                {user.mfaEnabled ? (
                  <span className="badge badge-success">Enabled</span>
                ) : (
                  <span className="badge badge-default">Disabled</span>
                )}
              </dd>
            </div>
            <div className="detail-item">
              <dt>Has Password</dt>
              <dd>
                {user.hasPassword ? (
                  <span className="badge badge-success">Yes</span>
                ) : (
                  <span className="badge badge-default">No</span>
                )}
              </dd>
            </div>
            <div className="detail-item">
              <dt>Account Status</dt>
              <dd>
                {user.suspendedAt ? (
                  <span className="badge badge-danger">Suspended</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="detail-section">
          <h3 className="section-title">Activity</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Created</dt>
              <dd>{formatRelativeTime(user.createdAt)}</dd>
            </div>
            <div className="detail-item">
              <dt>Last Updated</dt>
              <dd>{formatRelativeTime(user.updatedAt)}</dd>
            </div>
            <div className="detail-item">
              <dt>Last Sign In</dt>
              <dd>{user.lastSignInAt ? formatRelativeTime(user.lastSignInAt) : 'Never'}</dd>
            </div>
          </dl>
        </div>

        {user.oauthAccounts && user.oauthAccounts.length > 0 && (
          <div className="detail-section">
            <h3 className="section-title">Connected Accounts</h3>
            <div className="oauth-list">
              {user.oauthAccounts.map((account) => (
                <div key={`${account.provider}-${account.providerAccountId}`} className="oauth-item">
                  <span className="oauth-provider">{getProviderIcon(account.provider)} {account.provider}</span>
                  <span className="oauth-date">Connected {formatRelativeTime(account.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        
        .section-title {
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }
        
        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-item dt {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .detail-item dd {
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        
        .oauth-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .oauth-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .oauth-provider {
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .oauth-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    google: '🔵',
    github: '⚫',
    microsoft: '🟦',
    apple: '🍎',
    linkedin: '🔗',
  };
  return icons[provider.toLowerCase()] || '🔑';
}

