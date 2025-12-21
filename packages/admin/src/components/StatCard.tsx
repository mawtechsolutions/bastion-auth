'use client';

import { GlassCard } from '@mawtech/glass-ui';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  accentColor?: 'cyan' | 'purple' | 'green' | 'amber' | 'pink';
}

const accentColors = {
  cyan: {
    gradient: 'linear-gradient(135deg, #00F0FF, #0EA5E9)',
    glow: 'rgba(0, 240, 255, 0.2)',
    border: 'rgba(0, 240, 255, 0.3)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    glow: 'rgba(168, 85, 247, 0.2)',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    glow: 'rgba(16, 185, 129, 0.2)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    glow: 'rgba(245, 158, 11, 0.2)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  pink: {
    gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
    glow: 'rgba(236, 72, 153, 0.2)',
    border: 'rgba(236, 72, 153, 0.3)',
  },
};

export function StatCard({ 
  label, 
  value, 
  change, 
  positive,
  icon,
  accentColor = 'cyan'
}: StatCardProps) {
  const colors = accentColors[accentColor];
  
  return (
    <GlassCard variant="glow" padding="md" className="stat-card-wrapper">
      <div className="stat-card-inner">
        {icon && (
          <div className="stat-icon" style={{ background: colors.gradient }}>
            {icon}
          </div>
        )}
        <div className="stat-content">
          <p className="stat-label">{label}</p>
          <p className="stat-value" style={{ 
            background: colors.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {value}
          </p>
          {change && (
            <p className={`stat-change ${positive ? 'positive' : ''}`}>
              {positive && <TrendUpIcon />}
              {change}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .stat-card-inner {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
          min-width: 0;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.5);
          margin-bottom: 0.5rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 0.5rem;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .stat-change.positive {
          color: #10B981;
        }
      `}</style>
    </GlassCard>
  );
}

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// Icon components for stats
export function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function UserPlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function ZapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
