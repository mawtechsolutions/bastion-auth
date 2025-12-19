"use client";

import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getWebhook(id: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/webhooks/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch webhook');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch webhook:', error);
    return null;
  }
}

async function getDeliveries(webhookId: string) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/webhooks/${webhookId}/deliveries?limit=20`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch deliveries');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch deliveries:', error);
    return [];
  }
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default async function WebhookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [webhook, deliveries] = await Promise.all([
    getWebhook(params.id),
    getDeliveries(params.id),
  ]);

  if (!webhook) {
    notFound();
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/webhooks" className="breadcrumb-link">Webhooks</Link>
        <span className="breadcrumb-separator">/</span>
        <span>Webhook Details</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">
            <code style={{ fontWeight: 400, fontSize: '1.25rem' }}>{webhook.url}</code>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <span className={`badge ${webhook.isActive ? 'badge-success' : 'badge-default'}`}>
              {webhook.isActive ? 'Active' : 'Inactive'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Created {formatDateTime(webhook.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>Subscribed Events</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {webhook.events.map((event: string) => (
            <span key={event} className="event-tag">{event}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Deliveries</h2>
          <span className="badge badge-default">{deliveries.length}</span>
        </div>
        
        {deliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📤</div>
            <p className="empty-state-text">No deliveries yet</p>
          </div>
        ) : (
          <div className="delivery-list">
            {deliveries.map((delivery: any) => (
              <div key={delivery.id} className="delivery-item">
                <div className="delivery-status">
                  {delivery.status === 'success' ? (
                    <span className="status-icon success">✓</span>
                  ) : delivery.status === 'failed' ? (
                    <span className="status-icon failed">✗</span>
                  ) : (
                    <span className="status-icon pending">⋯</span>
                  )}
                </div>
                <div className="delivery-main">
                  <div className="delivery-header">
                    <span className="event-name">{delivery.event}</span>
                    <span className="delivery-time">{formatDateTime(delivery.createdAt)}</span>
                  </div>
                  <div className="delivery-details">
                    {delivery.statusCode && (
                      <span className={`status-code ${delivery.statusCode >= 200 && delivery.statusCode < 300 ? 'success' : 'error'}`}>
                        HTTP {delivery.statusCode}
                      </span>
                    )}
                    {delivery.duration && (
                      <span className="duration">{delivery.duration}ms</span>
                    )}
                    {delivery.attempts > 1 && (
                      <span className="attempts">{delivery.attempts} attempts</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        
        .event-tag {
          font-size: 0.8125rem;
          padding: 0.375rem 0.625rem;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-primary);
          border-radius: 4px;
        }
        
        .delivery-list {
          display: flex;
          flex-direction: column;
        }
        
        .delivery-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .delivery-item:last-child {
          border-bottom: none;
        }
        
        .delivery-status {
          width: 32px;
          display: flex;
          justify-content: center;
        }
        
        .status-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .status-icon.success {
          background: rgba(34, 197, 94, 0.2);
          color: var(--accent-success);
        }
        
        .status-icon.failed {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-danger);
        }
        
        .status-icon.pending {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }
        
        .delivery-main {
          flex: 1;
        }
        
        .delivery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        
        .event-name {
          font-weight: 500;
        }
        
        .delivery-time {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .delivery-details {
          display: flex;
          gap: 0.75rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        
        .status-code {
          font-family: monospace;
        }
        
        .status-code.success {
          color: var(--accent-success);
        }
        
        .status-code.error {
          color: var(--accent-danger);
        }
      `}</style>
    </>
  );
}

