"use client"

import { useState, useCallback, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ResizableTable } from '@/components/tables/ResizableTable';
import { tablesApi } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';

type PageParams = {
  id: string;
};

export default function TablePage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();

  // Fetch table data
  const { data: table, isLoading: isLoadingTable } = useQuery({
    queryKey: ['table', resolvedParams.id],
    queryFn: () => currentWorkspace ? tablesApi.getTable(currentWorkspace.id, resolvedParams.id) : null,
    enabled: !!currentWorkspace,
  });

  // Convert table columns to ResizableTable format
  const columns = table?.columns.columns.map(col => ({
    id: col.id.toString(),
    header: col.name,
    width: col.width || 200,
    type: col.type,
    minWidth: 100,
    color: col.color,
    textColor: col.text_color || col.textColor,
  })) || [];

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    // No API call needed for resizing, just pass the width to ResizableTable
    console.log('Column resized:', columnId, width);
  }, []);

  if (isLoadingWorkspace) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  if (!currentWorkspace && !isLoadingWorkspace) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Please select a workspace to view this table.</div>
      </div>
    );
  }

  if (isLoadingTable) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="p-8">
        <div className="text-red-500">Table not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/tables')}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{table.name}</h1>
        </div>
      </div>

      <ResizableTable
        workspaceId={currentWorkspace!.id}
        tableId={resolvedParams.id}
        columns={columns}
        onColumnResize={handleColumnResize}
      />
    </div>
  );
}