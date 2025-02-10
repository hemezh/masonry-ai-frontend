'use client';

import { usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  return isDashboardRoute ? <DashboardLayout>{children}</DashboardLayout> : children;
} 