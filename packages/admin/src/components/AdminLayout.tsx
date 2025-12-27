'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// Routes that should not show the admin layout (sidebar/header)
const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="admin-bg" />
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-main">
          <Header />
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </>
  );
}

