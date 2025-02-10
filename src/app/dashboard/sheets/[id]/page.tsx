"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ResizableSheet } from '@/components/sheets/ResizableSheet';
import { sheetsApi, type Column } from '@/lib/api/sheets';
import { useCallback, use } from 'react';

type PageParams = {
  id: string;
};

export default function SheetPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch sheet data
  const { data: sheet, isLoading: isLoadingSheet } = useQuery({
    queryKey: ['sheet', resolvedParams.id],
    queryFn: () => sheetsApi.getSheet(resolvedParams.id),
  });

  // Fetch sheet data rows
  const { data: sheetData, isLoading: isLoadingData } = useQuery({
    queryKey: ['sheet-data', resolvedParams.id],
    queryFn: () => sheetsApi.listSheetData(resolvedParams.id),
    enabled: !!sheet, // Only fetch data when we have the sheet
  });

  console.log('Sheet data:', sheet);
  console.log('Sheet rows:', sheetData);

  // Convert sheet columns to ResizableSheet format
  const columns = sheet?.columns.columns.map(col => ({
    id: col.id.toString(),
    header: col.name,
    width: col.width || 200,
    type: col.type,
    minWidth: 100,
  })) || [];

  // Convert sheet data to ResizableSheet format
  const data = sheetData?.map(row => {
    // Convert TypedColumnKeys back to simple column IDs
    const formattedRow: Record<string, any> = {};
    const rowData = row.data as Record<string, any>;
    Object.entries(rowData).forEach(([key, value]) => {
      const [id] = key.split('_'); // Split "1_s" to get just "1"
      formattedRow[id] = value;
    });
    return formattedRow;
  }) || [];

  // Update column mutation
  const updateColumnName = useCallback(
    (columnId: string) => {
      const column = sheet?.columns.columns.find(c => c.id.toString() === columnId);
      if (!column) return;
      const typeKey = `${column.id}_${column.type}`;
      return sheetsApi.updateColumn(resolvedParams.id, typeKey, { 
        name: column.name || '' 
      });
    },
    [resolvedParams.id, sheet?.columns.columns]
  );

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    // No API call needed for resizing, just pass the width to ResizableSheet
    console.log('Column resized:', columnId, width);
  }, []);

  if (isLoadingSheet || isLoadingData) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="p-8">
        <div className="text-red-500">Sheet not found</div>
      </div>
    );
  }

  console.log('Final columns:', columns);
  console.log('Final data:', data);

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
          <h1 className="text-2xl font-semibold text-foreground">{sheet.name}</h1>
          {sheet.description && (
            <p className="text-sm text-muted-foreground">
              {sheet.description}
            </p>
          )}
        </div>
      </div>
      <ResizableSheet 
        sheetId={resolvedParams.id}
        columns={columns}
        data={data}
        onColumnResize={handleColumnResize}
      />
    </div>
  );
}