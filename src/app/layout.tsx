'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/theme-context';
import { AuthProvider } from '@/contexts/auth-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { Toaster } from '@/components/ui/toaster';
import LayoutWrapper from '@/components/layout/layout-wrapper';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masonry AI',
  description: 'AI-powered data management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
          <QueryProvider>

            <WorkspaceProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
              <Toaster />
            </WorkspaceProvider>
          </QueryProvider>

          </AuthProvider>
      
        </ThemeProvider>
      </body>
    </html>
  );
}
