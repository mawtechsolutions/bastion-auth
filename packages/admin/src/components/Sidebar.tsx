'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: () => JSX.Element;
  count?: number;
}

const OVERVIEW_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/users', label: 'Users', icon: UsersIcon },
  { href: '/organizations', label: 'Organizations', icon: OrganizationsIcon },
];

const SECURITY_NAV: NavItem[] = [
  { href: '/sessions', label: 'Sessions', icon: SessionsIcon },
  { href: '/audit-logs', label: 'Audit Logs', icon: AuditIcon },
  { href: '/webhooks', label: 'Webhooks', icon: WebhooksIcon },
  { href: '/api-keys', label: 'API Keys', icon: KeysIcon },
];

const SETTINGS_NAV: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

// SVG Icons
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function OrganizationsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01" />
      <path d="M9 12v.01" />
      <path d="M9 15v.01" />
      <path d="M9 18v.01" />
    </svg>
  );
}

function SessionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function WebhooksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
      <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
      <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8H12" />
    </svg>
  );
}

function KeysIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// BastionAuth Logo - Shield with fortress towers and key
function BastionLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bastionGradSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="bastionGradDarkSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4E0" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Shield base */}
      <path
        d="M24 4L6 10v12c0 11.46 7.68 22.04 18 24 10.32-1.96 18-12.54 18-24V10L24 4z"
        fill="url(#bastionGradSidebar)"
        opacity="0.15"
      />
      <path
        d="M24 4L6 10v12c0 11.46 7.68 22.04 18 24 10.32-1.96 18-12.54 18-24V10L24 4z"
        stroke="url(#bastionGradSidebar)"
        strokeWidth="2"
        fill="none"
      />
      {/* Fortress towers */}
      <path
        d="M14 18v-4h-2v-2h2v-1h4v1h2v2h-2v4"
        stroke="url(#bastionGradDarkSidebar)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M34 18v-4h2v-2h-2v-1h-4v1h-2v2h2v4"
        stroke="url(#bastionGradDarkSidebar)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Key */}
      <circle
        cx="24"
        cy="22"
        r="4"
        stroke="#00F0FF"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M24 26v10M21 32h6M21 35h6"
        stroke="#00F0FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || 
      (item.href !== '/' && pathname.startsWith(item.href));
    const Icon = item.icon;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-link ${isActive ? 'active' : ''}`}
      >
        <Icon />
        <span className="nav-label">{item.label}</span>
        {item.count !== undefined && (
          <span className="nav-count">{item.count.toLocaleString()}</span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <Link href="/" className="sidebar-brand">
          <BastionLogo size={28} />
          <span className="brand-text">BastionAuth</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="section-title">Overview</span>
          {OVERVIEW_NAV.map(renderNavItem)}
        </div>

        <div className="nav-section">
          <span className="section-title">Security</span>
          {SECURITY_NAV.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {SETTINGS_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}

        <div className="footer-divider" />

        <a 
          href="https://docs.bastionauth.dev" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-link"
        >
          <DocsIcon />
          <span className="nav-label">Documentation</span>
        </a>

        <a 
          href="https://bastionauth.dev/support" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-link"
        >
          <HelpIcon />
          <span className="nav-label">Help & Support</span>
        </a>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: #0D1117;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        .sidebar-header {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-brand {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: -0.01em;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.25rem 0.75rem;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 1.75rem;
        }

        .section-title {
          display: block;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(248, 250, 252, 0.4);
          padding: 0 0.75rem;
          margin-bottom: 0.5rem;
        }

        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .footer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 0.5rem 0;
        }
      `}</style>

      <style jsx global>{`
        .sidebar .nav-link {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          color: rgba(248, 250, 252, 0.7);
          text-decoration: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s ease;
          margin-bottom: 2px;
        }

        .sidebar .nav-link:hover {
          color: rgba(248, 250, 252, 0.95);
          background: rgba(255, 255, 255, 0.04);
        }

        .sidebar .nav-link.active {
          color: #0D1117;
          background: #00F0FF;
        }

        .sidebar .nav-link.active:hover {
          background: #00D4E0;
        }

        .sidebar .nav-link svg {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
        }

        .sidebar .nav-link.active svg {
          color: #0D1117;
        }

        .sidebar .nav-label {
          flex: 1;
        }

        .sidebar .nav-count {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          background: rgba(0, 240, 255, 0.15);
          color: #00F0FF;
          border-radius: 10px;
        }

        .sidebar .nav-link.active .nav-count {
          background: rgba(0, 0, 0, 0.2);
          color: #0D1117;
        }
      `}</style>
    </aside>
  );
}
