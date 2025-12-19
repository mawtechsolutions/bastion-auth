'use client';

import Link from 'next/link';

import { formatRelativeTime } from '@bastionauth/core';
import type { Organization } from '@bastionauth/core';

interface OrganizationWithCounts extends Organization {
  _count?: {
    members: number;
  };
}

interface OrganizationTableProps {
  organizations: OrganizationWithCounts[];
}

export function OrganizationTable({ organizations }: OrganizationTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏢</div>
        <p className="empty-state-text">No organizations found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Organization</th>
            <th>Slug</th>
            <th>Members</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr key={org.id}>
              <td>
                <div className="org-cell">
                  <div className="org-logo">
                    {org.imageUrl ? (
                      <img src={org.imageUrl} alt="" />
                    ) : (
                      <span>{org.name[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="org-info">
                    <span className="org-name">{org.name}</span>
                  </div>
                </div>
              </td>
              <td>
                <code className="org-slug">{org.slug}</code>
              </td>
              <td>
                <span className="member-count">{org._count?.members || 0}</span>
              </td>
              <td>{formatRelativeTime(org.createdAt)}</td>
              <td>
                <Link href={`/organizations/${org.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .org-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .org-logo {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }
        
        .org-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .org-name {
          font-weight: 500;
        }
        
        .org-slug {
          font-size: 0.8125rem;
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        
        .member-count {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

