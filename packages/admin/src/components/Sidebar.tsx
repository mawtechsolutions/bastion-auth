'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/organizations', label: 'Organizations', icon: '🏢' },
  { href: '/sessions', label: 'Sessions', icon: '🔐' },
  { href: '/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/webhooks', label: 'Webhooks', icon: '🔗' },
  { href: '/api-keys', label: 'API Keys', icon: '🔑' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand">
          🏰 BastionAuth
        </Link>
        <span className="sidebar-badge">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a href="https://docs.bastionauth.dev" target="_blank" rel="noopener" className="sidebar-link">
          <span className="sidebar-icon">📚</span>
          <span>Documentation</span>
        </a>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-brand {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
        }

        .sidebar-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0.25rem 0.5rem;
          background: var(--accent-primary);
          color: white;
          border-radius: 4px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.75rem;
          overflow-y: auto;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          transition: all 0.15s;
        }

        .sidebar-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: var(--accent-primary);
          color: white;
        }

        .sidebar-icon {
          font-size: 1rem;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid var(--border-color);
        }
      `}</style>
    </aside>
  );
}

