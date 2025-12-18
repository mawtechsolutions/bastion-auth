'use client';

import type { Session } from '@bastionauth/core';
import { formatRelativeTime } from '@bastionauth/core';

interface SessionListProps {
  sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state-small">
        <p>No active sessions</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      {sessions.map((session) => (
        <div key={session.id} className="session-item">
          <div className="session-info">
            <div className="session-device">
              <span className="device-icon">{getDeviceIcon(session.userAgent || '')}</span>
              <span className="device-name">{parseUserAgent(session.userAgent || '')}</span>
            </div>
            <div className="session-meta">
              <span>{session.ipAddress || 'Unknown IP'}</span>
              <span className="separator">•</span>
              <span>Last active {formatRelativeTime(session.lastActiveAt || session.createdAt)}</span>
            </div>
          </div>
          <div className="session-actions">
            <button className="btn btn-ghost btn-sm">Revoke</button>
          </div>
        </div>
      ))}

      <style jsx>{`
        .session-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }
        
        .session-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .session-device {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 500;
        }
        
        .device-icon {
          font-size: 1.125rem;
        }
        
        .session-meta {
          font-size: 0.8125rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .separator {
          color: var(--text-muted);
        }
        
        .empty-state-small {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function getDeviceIcon(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return '📱';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
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

