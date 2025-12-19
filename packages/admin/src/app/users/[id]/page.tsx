"use client";

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UserDetailPanel } from '@/components/UserDetailPanel';
import { SessionList } from '@/components/SessionList';
import { UserActions } from '@/components/UserActions';

async function getUser(id: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/users/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

async function getUserSessions(userId: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}/sessions`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [user, sessions] = await Promise.all([
    getUser(params.id),
    getUserSessions(params.id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/users" className="breadcrumb-link">Users</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{user.email}</span>
      </div>

      <div className="user-detail-header">
        <div className="user-detail-info">
          <div className="avatar avatar-lg">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" />
            ) : (
              <span>{(user.firstName?.[0] || user.email[0]).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email}
            </h1>
            <p className="page-description">{user.email}</p>
          </div>
        </div>
        <UserActions userId={user.id} isSuspended={!!user.suspendedAt} />
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <UserDetailPanel user={user} />
          
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">Active Sessions</h2>
              <span className="badge badge-default">{sessions.length}</span>
            </div>
            <SessionList sessions={sessions} />
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div className="action-list">
              <button className="action-btn">
                <span>📧</span>
                <span>Send Password Reset</span>
              </button>
              <button className="action-btn">
                <span>✉️</span>
                <span>Resend Verification</span>
              </button>
              <button className="action-btn">
                <span>🔄</span>
                <span>Force Sign Out</span>
              </button>
              <button className="action-btn danger">
                <span>🗑️</span>
                <span>Delete User</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Organizations</h3>
            {user.organizationMemberships?.length > 0 ? (
              <div className="org-list">
                {user.organizationMemberships.map((membership: any) => (
                  <Link 
                    key={membership.organization.id}
                    href={`/organizations/${membership.organization.id}`}
                    className="org-item"
                  >
                    <span>{membership.organization.name}</span>
                    <span className="badge badge-default">{membership.role.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted">No organizations</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        
        .breadcrumb-link {
          color: var(--text-secondary);
          text-decoration: none;
        }
        
        .breadcrumb-link:hover {
          color: var(--text-primary);
        }
        
        .breadcrumb-separator {
          color: var(--text-muted);
        }
        
        .user-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .user-detail-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .avatar-lg {
          width: 64px;
          height: 64px;
          font-size: 1.5rem;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }
        
        .action-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: var(--bg-tertiary);
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          width: 100%;
        }
        
        .action-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .action-btn.danger:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--accent-danger);
        }
        
        .org-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .org-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
        }
        
        .org-item:hover {
          color: var(--text-primary);
        }
        
        .text-muted {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}

