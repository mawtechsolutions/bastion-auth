'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GlassCard, GlassButton } from '@mawtech/glass-ui';

import { UserTable } from '@/components/UserTable';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastSignInAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function UsersPageContent() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';
  
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState(search);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
        const url = new URL(`${apiUrl}/api/v1/admin/users`);
        url.searchParams.set('page', page);
        url.searchParams.set('limit', '20');
        if (search) url.searchParams.set('search', search);

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data || []);
          setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    window.location.href = `/users?${params.toString()}`;
  };

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">Manage all users in your system</p>
        </div>
        <div className="page-actions">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-wrapper">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input search-input"
              />
            </div>
          </form>
          <GlassButton variant="primary">
            <PlusIcon />
            Add User
          </GlassButton>
        </div>
      </div>

      <GlassCard variant="glow" padding="none">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <UserTable users={users} />
            
            <div className="pagination">
              <span className="pagination-info">
                Showing {users.length} of {pagination.total} users
              </span>
              <div className="pagination-buttons">
                {pagination.page > 1 && (
                  <Link
                    href={`/users?page=${pagination.page - 1}${search ? `&search=${search}` : ''}`}
                    className="btn btn-ghost btn-sm"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="pagination-current">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/users?page=${pagination.page + 1}${search ? `&search=${search}` : ''}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </GlassCard>

      <style jsx>{`
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-form {
          margin: 0;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-wrapper :global(svg) {
          position: absolute;
          left: 1rem;
          color: rgba(248, 250, 252, 0.4);
          pointer-events: none;
        }

        .search-input {
          width: 280px;
          padding-left: 2.75rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: rgba(248, 250, 252, 0.4);
          gap: 1rem;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 240, 255, 0.1);
          border-top-color: #00F0FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }

        .pagination-info {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pagination-current {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.6);
          padding: 0 0.5rem;
        }
      `}</style>
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UsersPageContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p>Loading...</p>
      <style jsx>{`
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: rgba(248, 250, 252, 0.4);
          gap: 1rem;
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 240, 255, 0.1);
          border-top-color: #00F0FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
