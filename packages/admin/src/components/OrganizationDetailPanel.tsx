'use client';

import type { Organization } from '@bastionauth/core';
import { formatRelativeTime } from '@bastionauth/core';

interface OrganizationDetailPanelProps {
  organization: Organization;
}

export function OrganizationDetailPanel({ organization }: OrganizationDetailPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Organization Details</h2>
      
      <div className="detail-grid">
        <div className="detail-section">
          <h3 className="section-title">Basic Info</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Name</dt>
              <dd>{organization.name}</dd>
            </div>
            <div className="detail-item">
              <dt>Slug</dt>
              <dd><code>{organization.slug}</code></dd>
            </div>
            <div className="detail-item">
              <dt>ID</dt>
              <dd><code className="id-code">{organization.id}</code></dd>
            </div>
          </dl>
        </div>

        <div className="detail-section">
          <h3 className="section-title">Metadata</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Created</dt>
              <dd>{formatRelativeTime(organization.createdAt)}</dd>
            </div>
            <div className="detail-item">
              <dt>Last Updated</dt>
              <dd>{formatRelativeTime(organization.updatedAt)}</dd>
            </div>
          </dl>
        </div>
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
        
        .detail-item code {
          font-size: 0.8125rem;
          background: var(--bg-tertiary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }
        
        .id-code {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

