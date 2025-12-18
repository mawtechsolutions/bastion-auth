import type { Metadata } from 'next';

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

import './globals.css';

export const metadata: Metadata = {
  title: 'BastionAuth Admin',
  description: 'Admin dashboard for BastionAuth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="admin-layout">
          <Sidebar />
          <div className="admin-main">
            <Header />
            <main className="admin-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

