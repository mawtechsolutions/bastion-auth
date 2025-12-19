"use client";

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OrganizationDetailPanel } from '@/components/OrganizationDetailPanel';
import { MemberList } from '@/components/MemberList';

async function getOrganization(id: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/organizations/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch organization');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    return null;
  }
}

async function getOrganizationMembers(orgId: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/organizations/${orgId}/members`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return [];
  }
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [organization, members] = await Promise.all([
    getOrganization(params.id),
    getOrganizationMembers(params.id),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/organizations" className="breadcrumb-link">Organizations</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{organization.name}</span>
      </div>

      <div className="org-detail-header">
        <div className="org-detail-info">
          <div className="org-logo-lg">
            {organization.logoUrl ? (
              <img src={organization.logoUrl} alt="" />
            ) : (
              <span>{organization.name[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="page-title">{organization.name}</h1>
            <p className="page-description">
              <code className="slug-badge">{organization.slug}</code>
            </p>
          </div>
        </div>
        <div className="org-actions">
          <button className="btn btn-ghost">Edit Organization</button>
          <button className="btn btn-danger">Delete</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <OrganizationDetailPanel organization={organization} />
          
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
              <h2 className="card-title">Members</h2>
              <span className="badge badge-default">{members.length}</span>
            </div>
            <MemberList members={members} />
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Quick Stats</h3>
            <div className="stat-list">
              <div className="stat-item">
                <span className="stat-label">Members</span>
                <span className="stat-value">{members.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Admins</span>
                <span className="stat-value">
                  {members.filter((m: any) => m.role?.name === 'admin' || m.role?.name === 'owner').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending Invites</span>
                <span className="stat-value">{organization.pendingInvitations || 0}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Roles</h3>
            {organization.roles && organization.roles.length > 0 ? (
              <div className="role-list">
                {organization.roles.map((role: any) => (
                  <div key={role.id} className="role-item">
                    <span className="role-name">{role.name}</span>
                    {role.isDefault && (
                      <span className="badge badge-default">Default</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No custom roles</p>
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
        
        .org-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .org-detail-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .org-logo-lg {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          background: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }
        
        .org-logo-lg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .slug-badge {
          font-size: 0.875rem;
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        
        .org-actions {
          display: flex;
          gap: 0.75rem;
        }
        
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }
        
        .stat-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        
        .stat-item:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .stat-value {
          font-size: 0.9375rem;
          font-weight: 600;
        }
        
        .role-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .role-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .role-name {
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .text-muted {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
}

