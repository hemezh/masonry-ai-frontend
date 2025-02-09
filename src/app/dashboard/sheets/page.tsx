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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sheets</h1>
          <p className="text-sm text-muted-foreground">Create and manage your data sheets</p>
        </div>
        <Button onClick={() => router.push('/dashboard/sheets/new')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Sheet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New Sheet Card */}
        <button
          onClick={() => router.push('/dashboard/sheets/new')}
          className="h-[200px] rounded-lg border border-dashed border-border hover:border-primary/50 bg-background p-6 flex flex-col items-center justify-center gap-4 transition-colors group"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <PlusIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground">Create New Sheet</h3>
            <p className="text-sm text-muted-foreground">Start with a blank sheet</p>
          </div>
        </button>

        {/* Existing Sheets */}
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => router.push(`/dashboard/sheets/${sheet.id}`)}
            className="group relative h-[200px] rounded-lg border bg-card p-6 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TableCellsIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">
                {sheet.rowCount} rows
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {sheet.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {sheet.description}
              </p>
            </div>
            <div className="absolute bottom-6 left-6 text-xs text-muted-foreground">
              Updated {formatDate(sheet.updatedAt)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 