'use client';

import Link from 'next/link';

import { formatRelativeTime, getInitials } from '@bastionauth/core';
import type { User } from '@bastionauth/core';

interface Member {
  id: string;
  user: User;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="empty-state-small">
        <p>No members found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar">
                    {member.user.imageUrl ? (
                      <img src={member.user.imageUrl} alt="" />
                    ) : (
                      <span>{getInitials(member.user)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {member.user.firstName || member.user.lastName
                        ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
                        : 'No name'}
                    </span>
                    <span className="user-email">{member.user.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${getRoleBadgeClass(member.role.name)}`}>
                  {member.role.name}
                </span>
              </td>
              <td>{formatRelativeTime(member.createdAt)}</td>
              <td>
                <div className="action-buttons">
                  <Link href={`/users/${member.user.id}`} className="btn btn-ghost btn-sm">
                    View User
                  </Link>
                  <button className="btn btn-ghost btn-sm">Change Role</button>
                  <button className="btn btn-ghost btn-sm text-danger">Remove</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .text-danger {
          color: var(--accent-danger);
        }
        
        .empty-state-small {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function getRoleBadgeClass(roleName: string): string {
  switch (roleName.toLowerCase()) {
    case 'owner':
      return 'badge-success';
    case 'admin':
      return 'badge-warning';
    default:
      return 'badge-default';
  }
}

