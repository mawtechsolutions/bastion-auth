'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/admin/api-keys`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch API keys');
      
      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/v1/admin/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  }

  function formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatRelativeTime(date: string | null): string {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-description">Manage API keys for programmatic access</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create API Key
        </button>
      </div>

      {newKey && (
        <div className="key-banner">
          <div className="key-banner-content">
            <div className="key-banner-icon">🔑</div>
            <div>
              <p className="key-banner-title">API Key Created Successfully</p>
              <p className="key-banner-text">
                Copy your key now. You won't be able to see it again!
              </p>
              <code className="key-display">{newKey}</code>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setNewKey(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            <p className="empty-state-text">No API keys created</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Create an API key to access the BastionAuth API programmatically
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Scopes</th>
                  <th>Last Used</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{key.name}</span>
                    </td>
                    <td>
                      <code className="key-prefix">{key.keyPrefix}...</code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {key.scopes.slice(0, 2).map((scope) => (
                          <span key={scope} className="scope-tag">{scope}</span>
                        ))}
                        {key.scopes.length > 2 && (
                          <span className="scope-more">+{key.scopes.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>{formatRelativeTime(key.lastUsedAt)}</td>
                    <td>
                      {key.expiresAt ? (
                        new Date(key.expiresAt) < new Date() ? (
                          <span className="badge badge-danger">Expired</span>
                        ) : (
                          formatDate(key.expiresAt)
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Never</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => revokeKey(key.id)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateApiKeyModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={(key) => {
            setShowCreateModal(false);
            setNewKey(key);
            fetchApiKeys();
          }}
        />
      )}

      <style jsx>{`
        .key-banner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid var(--accent-success);
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
        }
        
        .key-banner-content {
          display: flex;
          gap: 1rem;
        }
        
        .key-banner-icon {
          font-size: 1.5rem;
        }
        
        .key-banner-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .key-banner-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        
        .key-display {
          display: block;
          padding: 0.75rem;
          background: var(--bg-primary);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          word-break: break-all;
        }
        
        .key-prefix {
          font-size: 0.8125rem;
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        
        .scope-tag {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-primary);
          border-radius: 4px;
        }
        
        .scope-more {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
        
        .text-danger {
          color: var(--accent-danger);
        }
      `}</style>
    </>
  );
}

function CreateApiKeyModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void; 
  onCreated: (key: string) => void;
}) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read:users']);
  const [expiresIn, setExpiresIn] = useState('never');
  const [loading, setLoading] = useState(false);

  const SCOPE_OPTIONS = [
    { value: 'read:users', label: 'Read Users' },
    { value: 'write:users', label: 'Write Users' },
    { value: 'read:sessions', label: 'Read Sessions' },
    { value: 'write:sessions', label: 'Write Sessions' },
    { value: 'read:organizations', label: 'Read Organizations' },
    { value: 'write:organizations', label: 'Write Organizations' },
    { value: 'read:audit-logs', label: 'Read Audit Logs' },
    { value: 'admin', label: 'Full Admin Access' },
  ];

  const EXPIRY_OPTIONS = [
    { value: 'never', label: 'Never expires' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: '1y', label: '1 year' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || scopes.length === 0) return;
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/admin/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          scopes,
          expiresIn: expiresIn === 'never' ? null : expiresIn,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to create API key');
      
      const data = await response.json();
      onCreated(data.key);
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    } finally {
      setLoading(false);
    }
  }

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create API Key</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Key Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Production Backend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Scopes</label>
            <div className="scope-checkboxes">
              {SCOPE_OPTIONS.map((scope) => (
                <label key={scope.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                  />
                  <span>{scope.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Expiration</label>
            <select
              className="input"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name || scopes.length === 0}>
              {loading ? 'Creating...' : 'Create Key'}
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
          
          .scope-checkboxes {
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

