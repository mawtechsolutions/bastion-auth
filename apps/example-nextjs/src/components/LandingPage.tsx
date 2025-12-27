'use client';

import Link from 'next/link';

interface LandingPageProps {
  isAuthenticated: boolean;
  user: {
    firstName: string | null;
    email: string;
  } | null;
}

export function LandingPage({ isAuthenticated, user }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <header className="landing-header">
        <Link href="/" className="logo">
          <BastionLogo />
          <span>BastionAuth</span>
        </Link>
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/settings" className="btn btn-outline">Settings</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="nav-link">Sign in</Link>
              <Link href="/sign-up" className="btn btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero">
          <div className="hero-badge">
            <span className="badge-dot" />
            Open Source Authentication
          </div>
          
          <h1 className="hero-title">
            Authentication,<br />
            <span className="gradient-text">fortified.</span>
          </h1>
          
          <p className="hero-description">
            Complete authentication solution with email/password, OAuth, 
            magic links, passkeys, MFA, and enterprise-ready features.
          </p>

          {isAuthenticated && user ? (
            <div className="hero-welcome">
              <div className="glass-card welcome-card">
                <div className="welcome-avatar">
                  {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="welcome-content">
                  <h2>Welcome back, {user.firstName || user.email?.split('@')[0]}!</h2>
                  <p>You&apos;re signed in and ready to go.</p>
                </div>
              </div>
              <div className="hero-actions">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                  <ArrowIcon />
                </Link>
                <Link href="/settings" className="btn btn-glass btn-lg">
                  Account Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="hero-actions">
              <Link href="/sign-up" className="btn btn-primary btn-lg">
                Start for free
                <ArrowIcon />
              </Link>
              <Link href="/sign-in" className="btn btn-glass btn-lg">
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <section className="features">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <FeatureCard
              icon={<LockIcon />}
              title="Complete Auth"
              description="Email/password, OAuth, magic links, and passkeys - all built in."
              color="cyan"
            />
            <FeatureCard
              icon={<ShieldCheckIcon />}
              title="Multi-Factor Auth"
              description="TOTP authenticator apps, backup codes, and SMS verification."
              color="purple"
            />
            <FeatureCard
              icon={<BuildingIcon />}
              title="Organizations"
              description="Multi-tenancy with role-based access control and team management."
              color="green"
            />
            <FeatureCard
              icon={<ZapIcon />}
              title="Enterprise Ready"
              description="Webhooks, audit logs, API keys, and SSO integrations."
              color="amber"
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2024 BastionAuth. Built with security in mind.</p>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: #0A0E14;
          color: #F8FAFC;
          display: flex;
          flex-direction: column;
        }

        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #F8FAFC;
          text-decoration: none;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-link {
          color: rgba(248, 250, 252, 0.7);
          text-decoration: none;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #F8FAFC;
          background: rgba(255, 255, 255, 0.05);
        }

        .landing-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 2rem;
        }

        .hero {
          text-align: center;
          max-width: 700px;
          margin-bottom: 6rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #00F0FF;
          margin-bottom: 2rem;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: #00F0FF;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00F0FF 0%, #A855F7 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.25rem;
          color: rgba(248, 250, 252, 0.6);
          line-height: 1.7;
          margin-bottom: 2.5rem;
          max-width: 550px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hero-welcome {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .welcome-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
        }

        .welcome-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0D1117;
        }

        .welcome-content h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .welcome-content p {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.5);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00F0FF, #0EA5E9);
          color: #0D1117;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 240, 255, 0.3);
        }

        .btn-glass {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #F8FAFC;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #F8FAFC;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .features {
          width: 100%;
          max-width: 1000px;
        }

        .section-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .landing-footer {
          padding: 2rem;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .landing-footer p {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-description {
            font-size: 1.0625rem;
          }

          .landing-header {
            padding: 1rem;
          }

          .landing-main {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description,
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'cyan' | 'purple' | 'green' | 'amber';
}) {
  const colors = {
    cyan: { bg: 'rgba(0, 240, 255, 0.1)', border: 'rgba(0, 240, 255, 0.2)', icon: '#00F0FF' },
    purple: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)', icon: '#A855F7' },
    green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', icon: '#10B981' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', icon: '#F59E0B' },
  };

  return (
    <div className="feature-card">
      <div className="feature-icon" style={{ background: colors[color].bg, color: colors[color].icon }}>
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
      <style jsx>{`
        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: ${colors[color].border};
          transform: translateY(-4px);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .feature-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #F8FAFC;
        }

        .feature-description {
          font-size: 0.9375rem;
          color: rgba(248, 250, 252, 0.5);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}

// BastionAuth Logo - Shield with fortress towers and key
function BastionLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bastionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="bastionGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4E0" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Shield base */}
      <path
        d="M24 4L6 10v12c0 11.46 7.68 22.04 18 24 10.32-1.96 18-12.54 18-24V10L24 4z"
        fill="url(#bastionGrad)"
        opacity="0.15"
      />
      <path
        d="M24 4L6 10v12c0 11.46 7.68 22.04 18 24 10.32-1.96 18-12.54 18-24V10L24 4z"
        stroke="url(#bastionGrad)"
        strokeWidth="2"
        fill="none"
      />
      {/* Fortress towers */}
      <path
        d="M14 18v-4h-2v-2h2v-1h4v1h2v2h-2v4"
        stroke="url(#bastionGradDark)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M34 18v-4h2v-2h-2v-1h-4v1h-2v2h2v4"
        stroke="url(#bastionGradDark)"
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

// Icons
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

