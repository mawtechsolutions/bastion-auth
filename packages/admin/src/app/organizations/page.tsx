import Link from 'next/link';

import { OrganizationTable } from '@/components/OrganizationTable';

interface SearchParams {
  page?: string;
  search?: string;
}

async function getOrganizations(searchParams: SearchParams) {
  const apiUrl = process.env.BASTION_API_URL || 'http://localhost:3001';
  const page = searchParams.page || '1';
  const search = searchParams.search || '';
  
  const url = new URL(`${apiUrl}/api/v1/admin/organizations`);
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
      throw new Error('Failed to fetch organizations');
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data: organizations, pagination } = await getOrganizations(searchParams);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Organizations</h1>
          <p className="page-description">Manage organizations and their members</p>
        </div>
        <form method="GET" action="/organizations">
          <input
            type="search"
            name="search"
            placeholder="Search organizations..."
            defaultValue={searchParams.search}
            className="input search-input"
          />
        </form>
      </div>

      <div className="card">
        <OrganizationTable organizations={organizations} />
        
        <div className="pagination">
          <span className="pagination-info">
            Showing {organizations.length} of {pagination.total} organizations
          </span>
          <div className="pagination-buttons">
            {pagination.page > 1 && (
              <Link
                href={`/organizations?page=${pagination.page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="btn btn-ghost btn-sm"
              >
                Previous
              </Link>
            )}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`/organizations?page=${pagination.page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
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

