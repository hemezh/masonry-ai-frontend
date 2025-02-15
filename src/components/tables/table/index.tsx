'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { tablesApi, type ColumnType } from '@/lib/api/tables';
import { Column, TableRow, validateValue } from './types';
import { TableHeader } from './table-header';
import { TableBody } from './table-body';
import { ColumnMenu } from './column-menu';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ResizableTableProps {
  workspaceId: string;
  tableId: string;
  columns: Column[];
  onColumnResize?: (columnId: string, width: number) => void;
}

export function ResizableTable({ workspaceId, tableId, columns: initialColumns, onColumnResize }: ResizableTableProps) {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [columnOrder, setColumnOrder] = useState(() => 
    initialColumns.map(col => col.id.toString())
  );
  const [totalWidth, setTotalWidth] = useState(() => 
    initialColumns.reduce((sum, col) => sum + col.width, 0) + 100
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const pendingUpdatesRef = useRef<Record<number, Record<string, any>>>({});
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Fetch paginated data
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['table-data', tableId],
    queryFn: ({ pageParam = 1 }) => 
      tablesApi.listTableData(workspaceId, tableId, pageParam, 50),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // Flatten the paginated data
  const flatData = infiniteData?.pages.flatMap(page => page.data) ?? [];

  // Mutations
  const updateColumnMutation = useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: { name?: string; width?: number; color?: string; textColor?: string } }) => 
      tablesApi.updateColumn(workspaceId, tableId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      toast.success('Column updated successfully');
    },
  });

  const reorderColumnsMutation = useMutation({
    mutationFn: (typeKeys: string[]) => 
      tablesApi.reorderColumns(workspaceId, tableId, typeKeys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
    },
  });

  const updateTableDataMutation = useMutation({
    mutationFn: ({ dataId, data }: { dataId: number; data: Record<string, any> }) => 
      tablesApi.updateTableData(workspaceId, tableId, dataId, data),
    onMutate: async ({ dataId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['table-data', tableId] });
      const previousData = queryClient.getQueryData(['table-data', tableId]);

      queryClient.setQueryData(['table-data', tableId], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((row: any) => 
            row.id === dataId ? { ...row, data: { ...row.data, ...data } } : row
          ),
        })),
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table-data', tableId], context.previousData);
      }
      setIsSaving(false);
      toast.error('Failed to save changes');
    },
    onSuccess: () => {
      setIsSaving(false);
      toast.success('Changes saved successfully');
    },
  });

  const addColumnMutation = useMutation({
    mutationFn: (data: { name: string; type: ColumnType; description?: string }) => 
      tablesApi.addColumn(workspaceId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      toast.success('Column added successfully');
    },
  });

  const createTableDataMutation = useMutation({
    mutationFn: (data: Record<string, any>) => 
      tablesApi.createTableData(workspaceId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data', tableId] });
      toast.success('Row added successfully');
    },
  });

  // Handlers
  const debouncedUpdateWidth = useCallback(
    (columnId: string, width: number) => {
      setIsSaving(true);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        updateColumnMutation.mutate({ columnId, data: { width } });
      }, 500);
    },
    [updateColumnMutation]
  );

  const debouncedSaveUpdates = useCallback(() => {
    const updates = pendingUpdatesRef.current;
    pendingUpdatesRef.current = {};

    Object.entries(updates).forEach(([dataId, formattedData]) => {
      updateTableDataMutation.mutate({
        dataId: parseInt(dataId),
        data: formattedData,
      });
    });
  }, [updateTableDataMutation]);

  const handleUpdateCell = (rowIndex: number, columnId: string, value: string) => {
    const row = flatData[rowIndex];
    if (!row) return;

    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    const validation = validateValue(value, column.type);
    
    setErrors(prev => ({
      ...prev,
      [rowIndex.toString()]: {
        ...prev[rowIndex.toString()],
        [columnId]: validation.error || ''
      }
    }));

    if (validation.isValid) {
      const dataId = row.id;
      if (dataId) {
        const currentUpdates = pendingUpdatesRef.current[dataId] || {};
        currentUpdates[columnId] = validation.convertedValue;
        pendingUpdatesRef.current[dataId] = currentUpdates;

        queryClient.setQueryData(['table-data', tableId], (old: any) => ({
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((row: any) => 
              row.id === dataId ? { ...row, data: { ...row.data, [columnId]: value } } : row
            ),
          })),
        }));

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        setIsSaving(true);
        updateTimeoutRef.current = setTimeout(debouncedSaveUpdates, 1000);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (typeof active.id === 'string' && typeof over.id === 'string') {
      const oldIndex = columnOrder.indexOf(active.id);
      const newIndex = columnOrder.indexOf(over.id);
      
      const newOrder = [...columnOrder];
      const [movedColumn] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedColumn);
      
      setColumnOrder(newOrder);
      reorderColumnsMutation.mutate(newOrder);
    }
  };

  const handleRenameColumn = (column: Column, newName: string) => {
    updateColumnMutation.mutate({ 
      columnId: column.id, 
      data: { name: newName } 
    });
  };

  const handleUpdateColumnColor = (columnId: string, color: string) => {
    updateColumnMutation.mutate({ 
      columnId, 
      data: { color } 
    });
  };

  const handleUpdateColumnTextColor = (columnId: string, textColor: string) => {
    updateColumnMutation.mutate({ 
      columnId, 
      data: { textColor } 
    });
  };

  // Load more data when scrolling
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      if (scrollHeight - scrollTop - clientHeight < clientHeight * 2 && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update local state when props change
  useEffect(() => {
    setColumns(initialColumns);
    setColumnOrder(initialColumns.map(col => col.id.toString()));
    setTotalWidth(initialColumns.reduce((sum, col) => sum + col.width, 0) + 100);
  }, [initialColumns]);

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-border">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <TableHeader
            columns={columns}
            onResize={debouncedUpdateWidth}
            onRename={handleRenameColumn}
            onUpdateColor={handleUpdateColumnColor}
            onUpdateTextColor={handleUpdateColumnTextColor}
            totalWidth={totalWidth}
          >
            <ColumnMenu
              onAddColumn={addColumnMutation.mutate}
              isAddingColumn={addColumnMutation.isPending}
            />
          </TableHeader>
          <TableBody
            parentRef={parentRef as React.RefObject<HTMLDivElement>}
            columns={columns}
            rows={flatData}
            totalWidth={totalWidth}
            errors={errors}
            onUpdateCell={handleUpdateCell}
          />
        </SortableContext>
      </DndContext>
      
      {/* Add Row button */}
      <div className="flex-shrink-0 border-t border-border/40 bg-muted/30">
        <button
          onClick={() => createTableDataMutation.mutate({})}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary px-4 py-2 hover:bg-accent/10 transition-colors"
          disabled={createTableDataMutation.isPending}
        >
          {createTableDataMutation.isPending ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
              Adding...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              New row
            </>
          )}
        </button>
      </div>
    </div>
  );
}
