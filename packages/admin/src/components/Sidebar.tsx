'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/users', label: 'Users', icon: UsersIcon },
  { href: '/organizations', label: 'Organizations', icon: OrganizationsIcon },
  { href: '/sessions', label: 'Sessions', icon: SessionsIcon },
  { href: '/audit-logs', label: 'Audit Logs', icon: AuditIcon },
  { href: '/webhooks', label: 'Webhooks', icon: WebhooksIcon },
  { href: '/api-keys', label: 'API Keys', icon: KeysIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

// SVG Icons
function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function OrganizationsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function WebhooksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function KeysIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

// Shield Logo Component
function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M20 2L4 8v10c0 9.55 6.83 18.48 16 20 9.17-1.52 16-10.45 16-20V8L20 2z"
        fill="url(#shieldGradient)"
        opacity="0.2"
      />
      <path
        d="M20 2L4 8v10c0 9.55 6.83 18.48 16 20 9.17-1.52 16-10.45 16-20V8L20 2z"
        stroke="url(#shieldGradient)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M20 6L8 10.5v7.5c0 7.16 5.12 13.86 12 15 6.88-1.14 12-7.84 12-15v-7.5L20 6z"
        fill="url(#shieldGradient)"
        opacity="0.3"
      />
      <path
        d="M15 19l3 3 7-7"
        stroke="#00F0FF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand">
          <ShieldLogo />
          <span className="brand-text">BastionAuth</span>
        </Link>
        <span className="sidebar-badge">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon"><Icon /></span>
              <span>{item.label}</span>
              {isActive && <span className="active-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a href="https://docs.bastionauth.dev" target="_blank" rel="noopener" className="sidebar-link">
          <span className="sidebar-icon"><DocsIcon /></span>
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
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0, 240, 255, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-text {
          font-size: 1.125rem;
          font-weight: 700;
          background: linear-gradient(135deg, #F8FAFC, #00F0FF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-badge {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.5rem;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          color: white;
          border-radius: 6px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: rgba(248, 250, 252, 0.6);
          text-decoration: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          margin-bottom: 0.25rem;
        }

        .sidebar-link:hover {
          background: rgba(0, 240, 255, 0.05);
          color: rgba(248, 250, 252, 0.9);
        }

        .sidebar-link.active {
          background: rgba(0, 240, 255, 0.1);
          color: #00F0FF;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .active-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, #00F0FF, #A855F7);
          border-radius: 0 3px 3px 0;
        }

        .sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          opacity: 0.7;
        }

        .sidebar-link.active .sidebar-icon {
          opacity: 1;
        }

        .sidebar-link.active .sidebar-icon :global(svg) {
          stroke: #00F0FF;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </aside>
  );
}
