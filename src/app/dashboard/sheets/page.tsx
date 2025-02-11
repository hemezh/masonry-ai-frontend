'use client';

import { useQuery } from '@tanstack/react-query';
import { PlusIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { sheetsApi, type Sheet } from '@/lib/api/sheets';

export default function SheetsPage() {
  const router = useRouter();
  
  const { data: sheets, isLoading, error } = useQuery({
    queryKey: ['sheets'],
    queryFn: () => sheetsApi.listSheets(),
  });

  console.log('Sheets data:', sheets);
  console.log('Loading state:', isLoading);
  console.log('Error:', error);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error loading sheets: {error.message}</div>
      </div>
    );
  }

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

        {/* Loading State */}
        {isLoading && (
          <div className="h-[200px] rounded-lg border bg-card p-6 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        )}

        {/* Existing Sheets */}
        {sheets?.map((sheet: Sheet) => (
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
                {sheet.columns?.columns?.length || 0} columns
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {sheet.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {sheet.description || 'No description'}
              </p>
            </div>
            <div className="absolute bottom-6 left-6 text-xs text-muted-foreground">
              Updated {formatDate(sheet.updated_at)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 