'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { Header } from '@/components/Header';

interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  maxMembers: number | null;
  allowedDomains: string[];
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  createdAt: string;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';

        // Fetch organization
        const orgResponse = await fetch(`${apiUrl}/api/v1/organizations/${slug}`, {
          credentials: 'include',
        });

        if (!orgResponse.ok) {
          if (orgResponse.status === 401) {
            router.push('/sign-in');
            return;
          }
          if (orgResponse.status === 404) {
            throw new Error('Organization not found');
          }
          throw new Error('Failed to fetch organization');
        }

        const orgData = await orgResponse.json();
        setOrganization(orgData);

        // Fetch members
        const membersResponse = await fetch(`${apiUrl}/api/v1/organizations/${slug}/members`, {
          credentials: 'include',
        });

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, router]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return { background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' };
      case 'admin':
        return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      default:
        return { background: 'var(--muted)', color: 'var(--muted-foreground)' };
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Loading organization...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !organization) {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingTop: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Organization Not Found</h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              {error || 'The organization you are looking for does not exist.'}
            </p>
            <Link href="/organizations" className="btn btn-primary">
              Back to Organizations
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingTop: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link 
            href="/organizations" 
            style={{ 
              color: 'var(--muted-foreground)', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Organizations
          </Link>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius)',
                background: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '2rem',
              }}>
                {organization.imageUrl ? (
                  <img 
                    src={organization.imageUrl} 
                    alt={organization.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: 'var(--radius)' 
                    }} 
                  />
                ) : (
                  organization.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {organization.name}
                </h1>
                <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                  /{organization.slug}
                </p>
              </div>
            </div>

            <Link 
              href={`/organizations/${slug}/settings`}
              className="btn"
              style={{
                background: 'var(--muted)',
                color: 'var(--foreground)',
              }}
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Members Section */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Members</h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link 
              href={`/organizations/${slug}/settings?tab=members`}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Invite Member
            </Link>
          </div>

          {members.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '2rem' }}>
              No members found
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map((member) => (
                <div 
                  key={member.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--background)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                    }}>
                      {member.user.imageUrl ? (
                        <img 
                          src={member.user.imageUrl} 
                          alt="" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%' 
                          }} 
                        />
                      ) : (
                        member.user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {member.user.firstName && member.user.lastName 
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user.email}
                      </div>
                      <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    ...getRoleBadgeColor(member.role),
                  }}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Organization Info */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Organization Details
          </h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div>
              <dt style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Created
              </dt>
              <dd style={{ fontWeight: 500 }}>
                {new Date(organization.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {organization.maxMembers && (
              <div>
                <dt style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Max Members
                </dt>
                <dd style={{ fontWeight: 500 }}>
                  {members.length} / {organization.maxMembers}
                </dd>
              </div>
            )}
            {organization.allowedDomains.length > 0 && (
              <div style={{ gridColumn: 'span 2' }}>
                <dt style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Allowed Domains
                </dt>
                <dd style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {organization.allowedDomains.map((domain) => (
                    <span 
                      key={domain}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {domain}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </>
  );
}

