import './globals.css';
import { Inter } from 'next/font/google';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ThemeProvider } from '@/contexts/theme-context';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
