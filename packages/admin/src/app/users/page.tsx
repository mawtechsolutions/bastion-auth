import Link from 'next/link';

import { UserTable } from '@/components/UserTable';

interface SearchParams {
  page?: string;
  search?: string;
}

async function getUsers(searchParams: SearchParams) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  const page = searchParams.page || '1';
  const search = searchParams.search || '';
  
  const url = new URL(`${apiUrl}/api/v1/admin/users`);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '20');
  if (search) url.searchParams.set('search', search);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data: users, pagination } = await getUsers(searchParams);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">Manage all users in your system</p>
        </div>
        <form method="GET" action="/users">
          <input
            type="search"
            name="search"
            placeholder="Search users..."
            defaultValue={searchParams.search}
            className="input search-input"
          />
        </form>
      </div>

      <div className="card">
        <UserTable users={users} />
        
        <div className="pagination">
          <span className="pagination-info">
            Showing {users.length} of {pagination.total} users
          </span>
          <div className="pagination-buttons">
            {pagination.page > 1 && (
              <Link
                href={`/users?page=${pagination.page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="btn btn-ghost btn-sm"
              >
                Previous
              </Link>
            )}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`/users?page=${pagination.page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="btn btn-ghost btn-sm"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

