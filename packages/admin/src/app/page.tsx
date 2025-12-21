'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@mawtech/glass-ui';
import { StatCard, UsersIcon, UserPlusIcon, ActivityIcon, ZapIcon, BuildingIcon, ShieldIcon } from '@/components/StatCard';

interface Stats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
  totalOrganizations: number;
  activeSessions: number;
  mfaEnabledUsers: number;
  mfaAdoptionRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsersThisWeek: 0,
    totalOrganizations: 0,
    activeSessions: 0,
    mfaEnabledUsers: 0,
    mfaAdoptionRate: 0,
  });

  useEffect(() => {
    // In production, this would fetch from the API
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/v1/admin/stats`, {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your authentication system</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12% from last month"
          positive
          icon={<UsersIcon />}
          accentColor="cyan"
        />
        <StatCard
          label="New Users (30d)"
          value={stats.newUsersThisMonth.toLocaleString()}
          change="This month"
          icon={<UserPlusIcon />}
          accentColor="green"
        />
        <StatCard
          label="Active Users (7d)"
          value={stats.activeUsersThisWeek.toLocaleString()}
          change="Weekly active"
          icon={<ActivityIcon />}
          accentColor="purple"
        />
        <StatCard
          label="Active Sessions"
          value={stats.activeSessions.toLocaleString()}
          change="Currently online"
          icon={<ZapIcon />}
          accentColor="amber"
        />
        <StatCard
          label="Organizations"
          value={stats.totalOrganizations.toLocaleString()}
          change="Total organizations"
          icon={<BuildingIcon />}
          accentColor="pink"
        />
        <StatCard
          label="MFA Enabled"
          value={`${stats.mfaAdoptionRate.toFixed(1)}%`}
          change={`${stats.mfaEnabledUsers} users`}
          icon={<ShieldIcon />}
          accentColor="cyan"
        />
      </div>

      <div className="dashboard-grid">
        <GlassCard variant="glow" padding="lg" className="activity-card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <a href="/audit-logs" className="btn btn-ghost btn-sm">
              View all →
            </a>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">
              <ActivityEmptyIcon />
            </div>
            <p className="empty-state-text">
              Recent activity will appear here once users start signing in.
            </p>
          </div>
        </GlassCard>

        <GlassCard variant="glow" padding="lg" className="quick-actions-card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <a href="/users" className="quick-action">
              <div className="quick-action-icon cyan">
                <UsersIcon />
              </div>
              <div className="quick-action-content">
                <span className="quick-action-title">Manage Users</span>
                <span className="quick-action-desc">View and manage user accounts</span>
              </div>
            </a>
            <a href="/organizations" className="quick-action">
              <div className="quick-action-icon purple">
                <BuildingIcon />
              </div>
              <div className="quick-action-content">
                <span className="quick-action-title">Organizations</span>
                <span className="quick-action-desc">Manage organizations & teams</span>
              </div>
            </a>
            <a href="/settings" className="quick-action">
              <div className="quick-action-icon green">
                <SettingsIcon />
              </div>
              <div className="quick-action-content">
                <span className="quick-action-title">Settings</span>
                <span className="quick-action-desc">Configure authentication settings</span>
              </div>
            </a>
          </div>
        </GlassCard>
      </div>

      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-state-icon {
          margin-bottom: 1rem;
          opacity: 0.4;
        }

        .empty-state-text {
          font-size: 0.9375rem;
          color: rgba(248, 250, 252, 0.4);
          max-width: 280px;
          line-height: 1.6;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .quick-action:hover {
          background: rgba(0, 240, 255, 0.05);
          border-color: rgba(0, 240, 255, 0.2);
          transform: translateX(4px);
        }

        .quick-action-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .quick-action-icon.cyan {
          background: linear-gradient(135deg, #00F0FF, #0EA5E9);
        }

        .quick-action-icon.purple {
          background: linear-gradient(135deg, #A855F7, #7C3AED);
        }

        .quick-action-icon.green {
          background: linear-gradient(135deg, #10B981, #059669);
        }

        .quick-action-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .quick-action-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .quick-action-desc {
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }
      `}</style>
    </>
  );
}

function ActivityEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
