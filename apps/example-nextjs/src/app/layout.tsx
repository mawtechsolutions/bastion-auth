import type { Metadata } from 'next';

import { BastionProvider } from '@bastionauth/nextjs';

import './globals.css';

export const metadata: Metadata = {
  title: 'BastionAuth Example',
  description: 'Example Next.js app with BastionAuth integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BastionProvider
          publishableKey={process.env.NEXT_PUBLIC_BASTION_PUBLISHABLE_KEY!}
          apiUrl={process.env.NEXT_PUBLIC_BASTION_API_URL}
        >
          {children}
        </BastionProvider>
      </body>
    </html>
  );
}

