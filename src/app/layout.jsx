import '@/style.css';
import { Suspense } from 'react';
import { Providers } from './providers';
import { Shell } from '@/components/Shell';

export const metadata = {
  title: 'EduVault — Free Books & Study Material',
  description: '386+ verified free textbooks, NCERT, OpenStax, and video lectures.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={null}>
            <Shell>
              {children}
            </Shell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
