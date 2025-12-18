import Link from 'next/link';

interface SearchParams {
  page?: string;
  search?: string;
}

async function getSessions(searchParams: SearchParams) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  const page = searchParams.page || '1';
  
  const url = new URL(`${apiUrl}/api/v1/admin/sessions`);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '20');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

function getDeviceIcon(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return '📱';
  }
  if (ua.includes('mac')) {
    return '💻';
  }
  if (ua.includes('windows')) {
    return '🖥️';
  }
  if (ua.includes('linux')) {
    return '🐧';
  }
  return '🌐';
}

function parseUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  
  let browser = 'Browser';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  
  let os = '';
  if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return os ? `${browser} on ${os}` : browser;
}

function formatRelativeTime(date: string): string {
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
  return then.toLocaleDateString();
}

function getInitials(user: { firstName?: string; lastName?: string; email: string }): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data: sessions, pagination } = await getSessions(searchParams);

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Sessions</h1>
        <p className="page-description">View and manage all active user sessions</p>
      </div>

      <div className="card">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <p className="empty-state-text">No active sessions found</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>Last Active</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: any) => (
                    <tr key={session.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar">
                            {session.user?.imageUrl ? (
                              <img src={session.user.imageUrl} alt="" />
                            ) : (
                              <span>{getInitials(session.user || { email: 'U' })}</span>
                            )}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {session.user?.firstName || session.user?.lastName
                                ? `${session.user?.firstName || ''} ${session.user?.lastName || ''}`.trim()
                                : 'No name'}
                            </span>
                            <span className="user-email">{session.user?.email || 'Unknown'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{getDeviceIcon(session.userAgent || '')}</span>
                          <span>{parseUserAgent(session.userAgent || '')}</span>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8125rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {session.ipAddress || 'Unknown'}
                        </code>
                      </td>
                      <td>{formatRelativeTime(session.lastActiveAt || session.createdAt)}</td>
                      <td>{formatRelativeTime(session.createdAt)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <span className="pagination-info">
                Showing {sessions.length} of {pagination.total} sessions
              </span>
              <div className="pagination-buttons">
                {pagination.page > 1 && (
                  <Link
                    href={`/sessions?page=${pagination.page - 1}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Previous
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/sessions?page=${pagination.page + 1}`}
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
    </>
  );
}

