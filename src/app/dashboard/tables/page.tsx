'use client';

import { useQuery } from '@tanstack/react-query';
import { PlusIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { tablesApi, type Table } from '@/lib/api/tables';
import { useWorkspace } from '@/contexts/workspace-context';

export default function TablesPage() {
  const router = useRouter();
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  
  const { data: tables, isLoading: isLoadingTables, error } = useQuery({
    queryKey: ['tables', currentWorkspace?.id],
    queryFn: () => currentWorkspace ? tablesApi.listTables(currentWorkspace.id) : Promise.resolve([]),
    enabled: !!currentWorkspace,
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
        <div className="text-muted-foreground">Please select a workspace to view tables.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error loading tables: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* New Table Card */}
        <button
          onClick={() => router.push('/dashboard/tables/new')}
          className="h-[240px] rounded-lg border border-dashed border-border hover:border-primary/50 bg-background p-6 flex flex-col items-center justify-center gap-4 transition-colors group"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <PlusIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground">Create New Table</h3>
            <p className="text-sm text-muted-foreground">Start with a blank table</p>
          </div>
        </button>

        {/* Loading State */}
        {isLoadingTables && (
          <div className="h-[240px] rounded-lg border bg-card p-6 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        )}

        {/* Existing Tables */}
        {tables?.map((table: Table) => (
          <button
            key={table.id}
            onClick={() => router.push(`/dashboard/tables/${table.id}`)}
            className="group relative h-[240px] rounded-lg border bg-card p-5 text-left shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TableCellsIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="font-medium">{table.columns?.columns?.length || 0}</span>
                  <span className="ml-1">columns</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex-1">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {table.name}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                {table.description || 'No description'}
              </p>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
              Updated {formatDate(table.updated_at)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 