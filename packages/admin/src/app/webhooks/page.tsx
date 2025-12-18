'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  _count?: {
    deliveries: number;
  };
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/admin/webhooks`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch webhooks');
      
      const data = await response.json();
      setWebhooks(data.data || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWebhook(id: string, isActive: boolean) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/v1/admin/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
        credentials: 'include',
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/v1/admin/webhooks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Webhooks</h1>
          <p className="page-description">Configure webhook endpoints for event notifications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Webhook
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <p>Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <p className="empty-state-text">No webhooks configured</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Create a webhook to receive real-time event notifications
            </p>
          </div>
        ) : (
          <div className="webhook-list">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="webhook-item">
                <div className="webhook-main">
                  <div className="webhook-header">
                    <code className="webhook-url">{webhook.url}</code>
                    <span className={`badge ${webhook.isActive ? 'badge-success' : 'badge-default'}`}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="webhook-events">
                    {webhook.events.slice(0, 3).map((event) => (
                      <span key={event} className="event-tag">{event}</span>
                    ))}
                    {webhook.events.length > 3 && (
                      <span className="event-more">+{webhook.events.length - 3} more</span>
                    )}
                  </div>
                  <div className="webhook-meta">
                    <span>{webhook._count?.deliveries || 0} deliveries</span>
                    <span className="separator">•</span>
                    <span>Created {new Date(webhook.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="webhook-actions">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => toggleWebhook(webhook.id, webhook.isActive)}
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <Link href={`/webhooks/${webhook.id}`} className="btn btn-ghost btn-sm">
                    View
                  </Link>
                  <button 
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWebhookModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false);
            fetchWebhooks();
          }}
        />
      )}

      <style jsx>{`
        .webhook-list {
          display: flex;
          flex-direction: column;
        }
        
        .webhook-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .webhook-item:last-child {
          border-bottom: none;
        }
        
        .webhook-main {
          flex: 1;
        }
        
        .webhook-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .webhook-url {
          font-size: 0.9375rem;
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .webhook-events {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .event-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-primary);
          border-radius: 4px;
        }
        
        .event-more {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .webhook-meta {
          font-size: 0.8125rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .separator {
          color: var(--text-muted);
        }
        
        .webhook-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .text-danger {
          color: var(--accent-danger);
        }
      `}</style>
    </>
  );
}

function CreateWebhookModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const EVENT_OPTIONS = [
    'user.created',
    'user.updated',
    'user.deleted',
    'session.created',
    'session.revoked',
    'organization.created',
    'organization.updated',
    'organization.member_added',
    'organization.member_removed',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || events.length === 0) return;
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/admin/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to create webhook');
      onCreated();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    } finally {
      setLoading(false);
    }
  }

  function toggleEvent(event: string) {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Webhook</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Endpoint URL</label>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Events</label>
            <div className="event-checkboxes">
              {EVENT_OPTIONS.map((event) => (
                <label key={event} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  <span>{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !url || events.length === 0}>
              {loading ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .modal {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            width: 500px;
            max-width: 90vw;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            border-bottom: 1px solid var(--border-color);
          }
          
          .modal-header h2 {
            font-size: 1.125rem;
            font-weight: 600;
          }
          
          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
          }
          
          form {
            padding: 1.25rem;
          }
          
          .form-group {
            margin-bottom: 1.25rem;
          }
          
          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          
          .event-checkboxes {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          
          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            cursor: pointer;
          }
          
          .checkbox-label input {
            accent-color: var(--accent-primary);
          }
          
          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding-top: 0.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}

