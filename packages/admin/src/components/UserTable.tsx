'use client';

import Link from 'next/link';

import { getInitials, formatRelativeTime } from '@bastionauth/core';
import type { User } from '@bastionauth/core';

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <p className="empty-state-text">No users found</p>
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
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Unverified</span>
                )}
              </td>
              <td>
                {user.mfaEnabled ? (
                  <span className="badge badge-success">Enabled</span>
                ) : (
                  <span className="badge badge-default">Disabled</span>
                )}
              </td>
              <td>
                {user.lastSignInAt
                  ? formatRelativeTime(user.lastSignInAt)
                  : 'Never'}
              </td>
              <td>{formatRelativeTime(user.createdAt)}</td>
              <td>
                <Link href={`/users/${user.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

