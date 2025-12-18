import Link from 'next/link';

interface SearchParams {
  page?: string;
  action?: string;
  userId?: string;
}

async function getAuditLogs(searchParams: SearchParams) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  const page = searchParams.page || '1';
  
  const url = new URL(`${apiUrl}/api/v1/admin/audit-logs`);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '50');
  if (searchParams.action) url.searchParams.set('action', searchParams.action);
  if (searchParams.userId) url.searchParams.set('userId', searchParams.userId);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
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

function getActionIcon(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('sign_in') || actionLower.includes('login')) return '🔓';
  if (actionLower.includes('sign_out') || actionLower.includes('logout')) return '🔒';
  if (actionLower.includes('sign_up') || actionLower.includes('register')) return '👤';
  if (actionLower.includes('password')) return '🔑';
  if (actionLower.includes('mfa') || actionLower.includes('2fa')) return '📱';
  if (actionLower.includes('email')) return '📧';
  if (actionLower.includes('session')) return '🔐';
  if (actionLower.includes('organization') || actionLower.includes('org')) return '🏢';
  if (actionLower.includes('delete')) return '🗑️';
  if (actionLower.includes('update') || actionLower.includes('edit')) return '✏️';
  if (actionLower.includes('create') || actionLower.includes('add')) return '➕';
  return '📋';
}

function getActionBadgeClass(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('sign_in') || actionLower.includes('login')) return 'badge-success';
  if (actionLower.includes('sign_out') || actionLower.includes('logout')) return 'badge-default';
  if (actionLower.includes('failed') || actionLower.includes('error')) return 'badge-danger';
  if (actionLower.includes('delete') || actionLower.includes('remove')) return 'badge-warning';
  return 'badge-default';
}

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'user.sign_in', label: 'Sign In' },
  { value: 'user.sign_out', label: 'Sign Out' },
  { value: 'user.sign_up', label: 'Sign Up' },
  { value: 'user.password_reset', label: 'Password Reset' },
  { value: 'user.mfa_enabled', label: 'MFA Enabled' },
  { value: 'session.revoked', label: 'Session Revoked' },
  { value: 'organization.created', label: 'Org Created' },
];

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data: logs, pagination } = await getAuditLogs(searchParams);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-description">Track all security and user activity events</p>
        </div>
        <form method="GET" action="/audit-logs" style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            name="action"
            className="input"
            defaultValue={searchParams.action || ''}
            style={{ width: '180px' }}
          >
            {ACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-ghost">Filter</button>
        </form>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="log-list">
              {logs.map((log: any) => (
                <div key={log.id} className="log-item">
                  <div className="log-icon">{getActionIcon(log.action)}</div>
                  <div className="log-content">
                    <div className="log-header">
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="log-time">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <div className="log-details">
                      {log.user ? (
                        <Link href={`/users/${log.userId}`} className="log-user">
                          {log.user.email}
                        </Link>
                      ) : (
                        <span className="log-user-unknown">System</span>
                      )}
                      {log.ipAddress && (
                        <>
                          <span className="log-separator">•</span>
                          <span className="log-ip">{log.ipAddress}</span>
                        </>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="log-meta">
                          {JSON.stringify(log.metadata).substring(0, 50)}
                          {JSON.stringify(log.metadata).length > 50 && '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination">
              <span className="pagination-info">
                Showing {logs.length} of {pagination.total} logs
              </span>
              <div className="pagination-buttons">
                {pagination.page > 1 && (
                  <Link
                    href={`/audit-logs?page=${pagination.page - 1}${searchParams.action ? `&action=${searchParams.action}` : ''}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Previous
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/audit-logs?page=${pagination.page + 1}${searchParams.action ? `&action=${searchParams.action}` : ''}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .log-list {
          display: flex;
          flex-direction: column;
        }
        
        .log-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .log-item:last-child {
          border-bottom: none;
        }
        
        .log-item:hover {
          background: var(--bg-tertiary);
        }
        
        .log-icon {
          font-size: 1.25rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .log-content {
          flex: 1;
        }
        
        .log-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        
        .log-time {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .log-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .log-user {
          color: var(--accent-primary);
          text-decoration: none;
        }
        
        .log-user:hover {
          text-decoration: underline;
        }
        
        .log-user-unknown {
          color: var(--text-muted);
        }
        
        .log-separator {
          color: var(--text-muted);
        }
        
        .log-ip {
          font-family: monospace;
          font-size: 0.8125rem;
        }
        
        .log-meta {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}

