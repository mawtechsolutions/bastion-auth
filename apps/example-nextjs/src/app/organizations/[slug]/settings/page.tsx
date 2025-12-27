'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Header } from '@/components/Header';

interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  maxMembers: number | null;
  allowedDomains: string[];
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

type TabType = 'general' | 'members' | 'danger';

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  
  const initialTab = (searchParams.get('tab') as TabType) || 'general';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const orgResponse = await fetch(`${apiUrl}/api/v1/organizations/${slug}`, {
        credentials: 'include',
      });

      if (!orgResponse.ok) {
        if (orgResponse.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch organization');
      }

      const orgData = await orgResponse.json();
      setOrganization(orgData);
      setName(orgData.name);

      // Fetch members
      const membersResponse = await fetch(`${apiUrl}/api/v1/organizations/${slug}/members`, {
        credentials: 'include',
      });
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.data || []);
      }

      // Fetch invitations
      const invitationsResponse = await fetch(`${apiUrl}/api/v1/organizations/${slug}/invitations`, {
        credentials: 'include',
      });
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to update organization');

      showSuccess('Settings saved');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');

      showSuccess('Invitation sent');
      setInviteEmail('');
      setInviteRole('member');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      showSuccess('Role updated');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      showSuccess('Member removed');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to revoke invitation');

      showSuccess('Invitation revoked');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteOrganization = async () => {
    if (deleteConfirmation !== organization?.name) return;

    try {
      const response = await fetch(`${apiUrl}/api/v1/organizations/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete organization');

      router.push('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
          </div>
        </main>
      </>
    );
  }

  if (!organization) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Organization not found</p>
          </div>
        </main>
      </>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '2rem', maxWidth: '800px' }}>
        <Link 
          href={`/organizations/${slug}`}
          style={{ 
            color: 'var(--muted-foreground)', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          ← Back to {organization.name}
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
          Manage your organization settings
        </p>

        {successMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            borderRadius: 'var(--radius)',
            color: '#22c55e',
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius)',
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1px'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
                fontWeight: 500,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Organization Name
            </h2>
            <form onSubmit={handleUpdateOrganization}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="org-name"
                  style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
                >
                  Name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || name === organization.name}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {/* Invite Form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Invite Member
              </h2>
              <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  style={{
                    flex: '1',
                    minWidth: '200px',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  Send Invitation
                </button>
              </form>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Pending Invitations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {invitations.map((inv) => (
                    <div 
                      key={inv.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{inv.email}</span>
                        <span style={{ 
                          marginLeft: '0.75rem', 
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--background)',
                          borderRadius: 'var(--radius)',
                        }}>
                          {inv.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Members ({members.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 500 }}>Member</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 500 }}>Role</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 500 }}>
                          {member.user.firstName} {member.user.lastName}
                        </div>
                        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                          {member.user.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {member.role === 'owner' ? (
                          <span>Owner</span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius)',
                              background: 'var(--background)',
                            }}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Danger Tab */}
        {activeTab === 'danger' && (
          <div className="card" style={{ borderColor: '#ef4444' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>
              Delete Organization
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Once you delete an organization, there is no going back. Please be certain.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Type <strong>{organization.name}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Organization name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <button
              onClick={handleDeleteOrganization}
              disabled={deleteConfirmation !== organization.name}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: 'var(--radius)',
                background: deleteConfirmation === organization.name ? '#ef4444' : 'var(--muted)',
                color: deleteConfirmation === organization.name ? 'white' : 'var(--muted-foreground)',
                cursor: deleteConfirmation === organization.name ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              Delete Organization
            </button>
          </div>
        )}
      </main>
    </>
  );
}

