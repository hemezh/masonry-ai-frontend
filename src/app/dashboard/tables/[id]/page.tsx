"use client"

import { useState, useCallback, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, ChevronRightIcon, UsersIcon, PencilIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { ResizableTable } from '@/components/tables/table/index';
import { tablesApi } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PanelRightCloseIcon, UploadIcon } from 'lucide-react';
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
    <div className="p-4 h-full flex">
      {/* Main content */}
      <div className="flex-1">
        <div className="sticky top-0 z-50 flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/tables"
              className="group flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-md ml-2 font-medium truncate max-w-[200px] text-zinc-800 dark:text-zinc-200 hover:text-primary transition-colors">
                  {table.name}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                {/* Example avatars - replace with actual collaborator data */}
                <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">JD</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-secondary/10 border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">AB</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-accent/10 border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">+2</span>
                </div>
              </div>
            
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-zinc-600 dark:text-zinc-300 bg-card border border-zinc-200 dark:border-zinc-800 hover:bg-muted hover:text-zinc-900 dark:hover:text-white transition-all duration-200"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-zinc-600 dark:text-zinc-300 bg-card border border-zinc-200 dark:border-zinc-800 hover:bg-muted hover:text-zinc-900 dark:hover:text-white transition-all duration-200"
            >
              <PanelRightCloseIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ResizableTable
          workspaceId={currentWorkspace!.id}
          tableId={resolvedParams.id}
          columns={columns}
          onColumnResize={handleColumnResize}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border ml-4 pl-4">
        <div className="sticky top-0">
          <h3 className="font-medium text-lg mb-4">Table Details</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Properties</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(table.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last modified</span>
                  <span>{new Date(table.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Columns</span>
                  <span>{columns.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {table.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}