'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GlassCard, GlassButton } from '@mawtech/glass-ui';

interface Session {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
        const url = new URL(`${apiUrl}/api/v1/admin/sessions`);
        url.searchParams.set('page', page);
        url.searchParams.set('limit', '20');

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessions(data.data || []);
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [page]);

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-description">View and manage all active user sessions</p>
        </div>
        <div className="page-actions">
          <GlassButton variant="secondary">
            <RefreshIcon />
            Refresh
          </GlassButton>
          <GlassButton variant="primary">
            <RevokeAllIcon />
            Revoke All
          </GlassButton>
        </div>
      </div>

      <GlassCard variant="glow" padding="none">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <LockIcon />
            </div>
            <p className="empty-state-text">No active sessions found</p>
            <p className="empty-state-hint">Sessions will appear here when users sign in</p>
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
                  {sessions.map((session) => (
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
                        <div className="device-cell">
                          <span className="device-icon">{getDeviceIcon(session.userAgent || '')}</span>
                          <span>{parseUserAgent(session.userAgent || '')}</span>
                        </div>
                      </td>
                      <td>
                        <code className="ip-code">{session.ipAddress || 'Unknown'}</code>
                      </td>
                      <td className="text-muted">{formatRelativeTime(session.lastActiveAt || session.createdAt)}</td>
                      <td className="text-muted">{formatRelativeTime(session.createdAt)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm btn-danger-text">
                          Revoke
                        </button>
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
                  <Link href={`/sessions?page=${pagination.page - 1}`} className="btn btn-ghost btn-sm">
                    ← Previous
                  </Link>
                )}
                <span className="pagination-current">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                {pagination.page < pagination.totalPages && (
                  <Link href={`/sessions?page=${pagination.page + 1}`} className="btn btn-ghost btn-sm">
                    Next →
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </GlassCard>

      <style jsx>{`
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: rgba(248, 250, 252, 0.4);
          gap: 1rem;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 240, 255, 0.1);
          border-top-color: #00F0FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          border-radius: 10px;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .user-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-email {
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .device-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(248, 250, 252, 0.7);
        }

        .device-icon {
          font-size: 1.25rem;
        }

        .ip-code {
          font-size: 0.8125rem;
          font-family: 'SF Mono', Menlo, monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: rgba(248, 250, 252, 0.6);
        }

        .text-muted {
          color: rgba(248, 250, 252, 0.5);
        }

        .btn-danger-text:hover {
          color: #EF4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }

        .pagination-info {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pagination-current {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.6);
          padding: 0 0.5rem;
        }
      `}</style>
    </>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionsPageContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'rgba(248, 250, 252, 0.4)', gap: '1rem' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(0, 240, 255, 0.1)', borderTopColor: '#00F0FF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p>Loading...</p>
    </div>
  );
}

// Helper functions
function getDeviceIcon(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return '📱';
  if (ua.includes('mac')) return '💻';
  if (ua.includes('windows')) return '🖥️';
  if (ua.includes('linux')) return '🐧';
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
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(user: { firstName?: string | null; lastName?: string | null; email: string }): string {
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

// Icons
function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function RevokeAllIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
