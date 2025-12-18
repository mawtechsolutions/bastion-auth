import { StatCard } from '@/components/StatCard';

async function getStats() {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/admin/stats`, {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      totalUsers: 0,
      newUsersThisMonth: 0,
      activeUsersThisWeek: 0,
      totalOrganizations: 0,
      activeSessions: 0,
      mfaEnabledUsers: 0,
      mfaAdoptionRate: 0,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-description">Overview of your authentication system</p>

      <div className="stats-grid">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12% from last month"
          positive
        />
        <StatCard
          label="New Users (30d)"
          value={stats.newUsersThisMonth.toLocaleString()}
          change="This month"
        />
        <StatCard
          label="Active Users (7d)"
          value={stats.activeUsersThisWeek.toLocaleString()}
          change="Weekly active"
        />
        <StatCard
          label="Active Sessions"
          value={stats.activeSessions.toLocaleString()}
          change="Currently online"
        />
        <StatCard
          label="Organizations"
          value={stats.totalOrganizations.toLocaleString()}
          change="Total organizations"
        />
        <StatCard
          label="MFA Enabled"
          value={`${stats.mfaAdoptionRate.toFixed(1)}%`}
          change={`${stats.mfaEnabledUsers} users`}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
          <a href="/audit-logs" className="btn btn-ghost btn-sm">
            View all
          </a>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">
            Recent activity will appear here once users start signing in.
          </p>
        </div>
      </div>
    </>
  );
}

