'use client';

import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  _count?: {
    members: number;
  };
}

interface OrganizationTableProps {
  organizations: Organization[];
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

export function OrganizationTable({ organizations }: OrganizationTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <BuildingIcon />
        </div>
        <p className="empty-state-text">No organizations found</p>
        <p className="empty-state-hint">Organizations will appear here once created</p>
        
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
                <span className="member-count">
                  <UsersIcon />
                  {org._count?.members || 0}
                </span>
              </td>
              <td className="text-muted">{formatRelativeTime(org.createdAt)}</td>
              <td>
                <Link href={`/organizations/${org.id}`} className="btn btn-ghost btn-sm">
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
        }

        tbody tr {
          transition: all 0.2s ease;
        }

        tbody tr:hover {
          background: rgba(0, 240, 255, 0.03);
        }

        .org-cell {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        
        .org-logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #A855F7, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .org-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .org-name {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .org-slug {
          font-size: 0.8125rem;
          font-family: 'SF Mono', Menlo, monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: rgba(248, 250, 252, 0.6);
        }
        
        .member-count {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: rgba(248, 250, 252, 0.7);
        }

        .text-muted {
          color: rgba(248, 250, 252, 0.5);
        }
      `}</style>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}
