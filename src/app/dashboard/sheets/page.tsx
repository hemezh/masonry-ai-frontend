'use client';

import { useState } from 'react';
import { PlusIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Sheet {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  rowCount: number;
}

export default function SheetsPage() {
  const router = useRouter();
  const [sheets] = useState<Sheet[]>([
    {
      id: '1',
      name: 'Customer Data',
      description: 'Customer information and contact details',
      updatedAt: '2024-01-20T10:00:00Z',
      rowCount: 150
    },
    {
      id: '2',
      name: 'Product Inventory',
      description: 'Current stock levels and product details',
      updatedAt: '2024-01-19T15:30:00Z',
      rowCount: 75
    },
    {
      id: '3',
      name: 'Sales Report',
      description: 'Monthly sales performance data',
      updatedAt: '2024-01-18T09:15:00Z',
      rowCount: 200
    }
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sheets</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground">
            Sheets functionality will be available soon. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
} 