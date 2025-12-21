'use client';

import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastSignInAt: string | null;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
}

function getInitials(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <UsersEmptyIcon />
        </div>
        <p className="empty-state-text">No users found</p>
        <p className="empty-state-hint">Users will appear here once they sign up</p>
        
        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
          }

          .empty-state-icon {
            margin-bottom: 1.25rem;
            opacity: 0.3;
          }

          .empty-state-text {
            font-size: 1rem;
            font-weight: 500;
            color: rgba(248, 250, 252, 0.6);
            margin-bottom: 0.5rem;
          }

          .empty-state-hint {
            font-size: 0.875rem;
            color: rgba(248, 250, 252, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>MFA</th>
            <th>Last Sign In</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt="" />
                    ) : (
                      <span>{getInitials(user)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : 'No name'}
                    </span>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
              </td>
              <td>
                {user.emailVerified ? (
                  <span className="badge badge-success">
                    <CheckIcon />
                    Verified
                  </span>
                ) : (
                  <span className="badge badge-warning">
                    <AlertIcon />
                    Unverified
                  </span>
                )}
              </td>
              <td>
                {user.mfaEnabled ? (
                  <span className="badge badge-cyan">
                    <ShieldIcon />
                    Enabled
                  </span>
                ) : (
                  <span className="badge badge-default">Disabled</span>
                )}
              </td>
              <td className="text-muted">
                {user.lastSignInAt
                  ? formatRelativeTime(user.lastSignInAt)
                  : 'Never'}
              </td>
              <td className="text-muted">{formatRelativeTime(user.createdAt)}</td>
              <td>
                <Link href={`/users/${user.id}`} className="btn btn-ghost btn-sm">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 1rem 1.25rem;
          text-align: left;
        }

        th {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(248, 250, 252, 0.4);
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        td {
          font-size: 0.875rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        tbody tr {
          transition: all 0.2s ease;
        }

        tbody tr:hover {
          background: rgba(0, 240, 255, 0.03);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .user-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-email {
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .text-muted {
          color: rgba(248, 250, 252, 0.5);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 6px;
          letter-spacing: 0.02em;
        }

        .badge-success {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .badge-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .badge-cyan {
          background: rgba(0, 240, 255, 0.1);
          color: #00F0FF;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .badge-default {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(248, 250, 252, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

function UsersEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
