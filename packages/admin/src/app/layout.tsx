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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <div className="admin-bg" />
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
