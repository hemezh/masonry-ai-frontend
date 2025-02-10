"use client"

import { useState } from 'react';
import { ResizableSheet } from '@/components/sheets/ResizableSheet';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface SheetContentProps {
  id: string;
}

export function SheetContent({ id }: SheetContentProps) {
  const router = useRouter();
  const [columns] = useState([
    { id: 'col-1', header: 'Name', width: 200 },
    { id: 'col-2', header: 'Email', width: 250 },
    { id: 'col-3', header: 'Role', width: 150 },
  ]);

  const [data] = useState([
    { 'col-1': 'John Doe', 'col-2': 'john@example.com', 'col-3': 'Admin' },
    { 'col-1': 'Jane Smith', 'col-2': 'jane@example.com', 'col-3': 'User' },
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/sheets')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customer Data</h1>
          <p className="text-sm text-muted-foreground">
            Sheet ID: {id}
          </p>
        </div>
      </div>
      <ResizableSheet 
        columns={columns}
        data={data}
        onColumnResize={(columnId, width) => {
          console.log('Column resized:', columnId, width);
        }}
      />
    </div>
  );
} 