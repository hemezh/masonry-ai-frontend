import { useState, useCallback, useRef, useEffect } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tablesApi, type ColumnType } from '@/lib/api/tables';
import { AddColumnDialog } from './add-column-dialog';
import { toast } from 'sonner';
import 'react-resizable/css/styles.css';
import debounce from 'lodash/debounce';

interface Column {
  id: string;
  header: string;
  width: number;
  type: ColumnType;
  minWidth?: number;
}

interface ResizableTableProps {
  workspaceId: string;
  tableId: string;
  columns: Column[];
  onColumnResize?: (columnId: string, width: number) => void;
}

interface SortableColumnProps {
  column: Column;
  onResize: (width: number) => void;
  children: React.ReactNode;
}

interface SortableRowProps {
  row: Record<string, any>;
  rowIndex: number;
  columns: Column[];
  updateCell: (rowIndex: number, columnId: string, value: string) => void;
  totalWidth: number;
  errors: Record<string, Record<string, string>>;
}

function SortableColumn({ column, onResize, children }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id.toString(),
    data: column,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Resizable
        width={column.width}
        height={40}
        minConstraints={[column.minWidth || 100, 40]}
        onResize={(e, data) => onResize(data.size.width)}
        draggableOpts={{ enableUserSelectHack: false }}
        handle={
          <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize group-hover:bg-primary/10 transition-colors z-10 flex items-center justify-center">
            <div className="w-px h-4 bg-border dark:bg-border/80 group-hover:bg-primary/25 transition-colors" />
          </div>
        }
        className="relative"
      >
        <div
          className="h-full relative flex-shrink-0 group"
          style={{ 
            width: column.width,
            borderRight: '1px solid hsl(var(--border) / 0.8)',
            borderBottom: '2px solid hsl(var(--border) / 0.8)',
            background: 'hsl(var(--background))'
          }}
        >
          <div 
            className="flex items-center h-full w-full cursor-move relative hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors"
            {...listeners}
          >
            {children}
          </div>
        </div>
      </Resizable>
    </div>
  );
}

function SortableRow({ row, rowIndex, columns, updateCell, totalWidth, errors }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rowIndex.toString(),
    data: row,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex min-h-[40px] relative group">
        <div 
          className="flex flex-1 border-b hover:bg-accent/5 transition-colors bg-white" 
          style={{ width: totalWidth }}
          {...listeners}
        >
          {columns.map((column: Column) => {
            const hasError = errors[rowIndex.toString()]?.[column.id];
            return (
              <div
                key={column.id}
                className="relative flex-shrink-0"
                style={{ 
                  width: column.width,
                  borderRight: '1px solid var(--border-color, #E5E7EB)'
                }}
              >
                <div className="h-full relative">
                  {hasError && (
                    <div className="absolute -top-5 left-0 text-xs text-white bg-red-500 px-2 py-1 z-50 whitespace-nowrap shadow-sm border border-red-400 rounded-md">
                      {errors[rowIndex.toString()][column.id]}
                    </div>
                  )}
                  <div className={`absolute inset-0 pointer-events-none border-2 transition-colors rounded-sm ${
                    hasError ? 'border-red-500/50' : 'border-transparent'
                  }`} />
                  <input
                    type="text"
                    value={row[column.id] || ''}
                    onChange={(e) => updateCell(rowIndex, column.id, e.target.value)}
                    className={`absolute inset-0 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/10 hover:bg-accent/5 rounded-none px-4 py-2 w-full focus:z-30 text-foreground`}
                  />
                </div>
              </div>
            );
          })}
          {/* Empty space */}
          <div className="border-r min-w-[100px] flex-1 bg-white" />
        </div>
      </div>
    </div>
  );
}

// Add validateValue function
const validateValue = (value: string, type: ColumnType): { isValid: boolean; error?: string; convertedValue?: any } => {
  if (!value) return { isValid: true, convertedValue: null }; // Allow empty values

  switch (type) {
    case 'i': // integer
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return { isValid: false, error: 'Must be an integer' };
      }
      return { isValid: true, convertedValue: num };

    case 'f': // float
      const float = Number(value);
      if (isNaN(float)) {
        return { isValid: false, error: 'Must be a number' };
      }
      return { isValid: true, convertedValue: float };

    case 'd': // date
      const date = new Date(value);
      if (date.toString() === 'Invalid Date') {
        return { isValid: false, error: 'Must be a valid date' };
      }
      return { isValid: true, convertedValue: date.toISOString() };

    case 's': // string
    default:
      return { isValid: true, convertedValue: value };
  }
};

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
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const pendingUpdatesRef = useRef<Record<number, Record<string, any>>>({});

  // Fetch paginated data
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
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
    staleTime: 5000, // Add staleTime to prevent unnecessary refetches
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });

  // Flatten the paginated data
  const flatData = infiniteData?.pages.flatMap(page => page.data) ?? [];
  const totalRows = infiniteData?.pages[0]?.pagination.total ?? 0;

  // Set up virtualizer with actual data length
  const rowVirtualizer = useVirtualizer({
    count: flatData.length || 0, // Use actual data length instead of total
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // row height
    overscan: 10,
    scrollMargin: 0,
    scrollPaddingStart: 0,
    scrollPaddingEnd: 0,
    horizontal: false,
  });

  // Load more data when scrolling - with better threshold calculation
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // Load more when within 2 screen heights of the bottom
      if (scrollHeight - scrollTop - clientHeight < clientHeight * 2 && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update local state when props change
  useEffect(() => {
    setColumns(initialColumns);
    setColumnOrder(initialColumns.map(col => col.id.toString()));
    setTotalWidth(initialColumns.reduce((sum, col) => sum + col.width, 0) + 100);
  }, [initialColumns]);

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

  // Update mutations
  const updateColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) => 
      tablesApi.updateColumn(workspaceId, tableId, columnId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['table-data', tableId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['table-data', tableId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['table-data', tableId], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((row: any) => {
              if (row.id === dataId) {
                return {
                  ...row,
                  data: {
                    ...row.data,
                    ...data // Apply updates directly to the data object
                  }
                };
              }
              return row;
            })
          }))
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['table-data', tableId], context.previousData);
      }
      setIsSaving(false);
      toast.error('Failed to save changes');
      console.error('Error updating table data:', err);
    },
    onSuccess: () => {
      setIsSaving(false);
      toast.success('Changes saved successfully');
    },
    onSettled: () => {
      // Only refetch if there was an error
      if (updateTableDataMutation.isError) {
        queryClient.invalidateQueries({ queryKey: ['table-data', tableId] });
      }
    }
  });

  const createTableDataMutation = useMutation({
    mutationFn: (data: Record<string, any>) => 
      tablesApi.createTableData(workspaceId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-data', tableId] });
      toast.success('Row added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding row:', error);
      toast.error('Failed to add row');
    },
  });

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: (data: { name: string; type: ColumnType; description?: string }) => 
      tablesApi.addColumn(workspaceId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setIsAddColumnDialogOpen(false);
      toast.success('Column added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding column:', error);
      let errorMessage = 'Failed to add column';
      
      // Handle validation errors
      if (error.message && error.message.includes('invalid_type')) {
        errorMessage = 'Invalid column data format';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Update column width mutation
  const updateColumnWidthMutation = useMutation({
    mutationFn: ({ columnId, width }: { columnId: string; width: number }) => {
      // Find the column to get its type key
      const column = columns.find(col => col.id === columnId);
      if (!column) {
        throw new Error('Column not found');
      }
      return tablesApi.updateColumn(workspaceId, tableId, columnId, { width });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  // Debounced column width update
  const debouncedUpdateWidth = useCallback(
    (columnId: string, width: number) => {
      setIsSaving(true);
      
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set new timeout
      resizeTimeoutRef.current = setTimeout(() => {
        updateColumnWidthMutation.mutate({ columnId, width });
      }, 500);
    },
    [updateColumnWidthMutation]
  );

  const handleAddColumn = (data: { name: string; type: ColumnType; description?: string }) => {
    addColumnMutation.mutate(data);
  };

  const addRow = () => {
    // Create an empty row without any initial values
    createTableDataMutation.mutate({});
  };

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

  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    const dataItem = flatData[rowIndex];
    if (!dataItem) return;

    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    // Validate the value
    const validation = validateValue(value, column.type);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [rowIndex.toString()]: {
        ...prev[rowIndex.toString()],
        [columnId]: validation.error || ''
      }
    }));

    // Only queue update if valid
    if (validation.isValid) {
      const dataId = dataItem.id;
      if (dataId) {
        // Get or initialize the pending updates for this row
        const currentUpdates = pendingUpdatesRef.current[dataId] || {};
        
        // Add the updated field with converted value
        currentUpdates[columnId] = validation.convertedValue;

        // Store the updates
        pendingUpdatesRef.current[dataId] = currentUpdates;

        // Optimistically update the UI immediately
        queryClient.setQueryData(['table-data', tableId], (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((row: any) => {
                if (row.id === dataId) {
                  return {
                    ...row,
                    data: {
                      ...row.data,
                      [columnId]: value // Use the display value for immediate UI update
                    }
                  };
                }
                return row;
              })
            }))
          };
        });

        // Clear any existing timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        setIsSaving(true);

        // Set new timeout
        updateTimeoutRef.current = setTimeout(() => {
          debouncedSaveUpdates();
        }, 1000);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (typeof active.id === 'string' && typeof over.id === 'string') {
      // Handle column reordering
      const oldIndex = columnOrder.indexOf(active.id);
      const newIndex = columnOrder.indexOf(over.id);
      
      const newOrder = [...columnOrder];
      const [movedColumn] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedColumn);
      
      // Update column order
      setColumnOrder(newOrder);
      reorderColumnsMutation.mutate(newOrder);

      // Update the order of data in each row
      const reorderedData = flatData.map(row => {
        const newData = { ...row };
        const reorderedRowData = {} as Record<string, any>;
        newOrder.forEach(columnId => {
          reorderedRowData[columnId] = row.data[columnId];
        });
        newData.data = reorderedRowData;
        return newData;
      });

      // Update the query cache with reordered data
      queryClient.setQueryData(['table-data', tableId], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: reorderedData,
          })),
        };
      });
    }
  };

  // Get ordered columns for display
  const orderedColumns = columnOrder.map(id => 
    columns.find(col => col.id.toString() === id)!
  );

  return (
    <div className="relative h-[calc(100vh-12rem)] p-1 rounded-lg overflow-hidden border shadow-sm">
      {isSaving && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm rounded-md font-medium border border-emerald-200/50 shadow-sm dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900">
          Saving changes...
        </div>
      )}
      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
          {/* Outer container for synchronized scrolling */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Header container that syncs with body scroll */}
            <div className="min-h-[40px] sticky top-0 z-10 shadow-sm overflow-hidden">
              <div className="flex" style={{ width: totalWidth, background: 'white' }}>
                <SortableContext 
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((column: Column) => (
                    <SortableColumn
                      key={column.id}
                      column={column}
                      onResize={(width) => {
                        const newColumns = columns.map(col => 
                          col.id === column.id ? { ...col, width } : col
                        );
                        setTotalWidth(newColumns.reduce((sum, col) => sum + col.width, 0) + 100);
                        setColumns(newColumns);
                        debouncedUpdateWidth(column.id.toString(), width);
                        if (onColumnResize) {
                          onColumnResize(column.id.toString(), width);
                        }
                      }}
                    >
                      <div className="flex items-center h-full w-full cursor-col-resize relative group">
                        <input
                          type="text"
                          value={column.header}
                          onChange={(e) => {
                            const newColumns = columns.map(col =>
                              col.id === column.id ? { ...col, header: e.target.value } : col
                            );
                            setColumns(newColumns);
                            updateColumnMutation.mutate({
                              columnId: column.id.toString(),
                              name: e.target.value,
                            });
                          }}
                          className="absolute inset-0 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-none px-4 py-2 w-full focus:z-30 text-foreground font-medium dark:focus:ring-primary/40"
                        />
                        <span className="pointer-events-none px-4 py-2 w-full truncate font-medium text-foreground">
                          {column.header}
                        </span>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4/5 bg-border opacity-50 group-hover:opacity-100 dark:bg-border/80" />
                      </div>
                    </SortableColumn>
                  ))}
                </SortableContext>
                {/* Add Column button */}
                <div className="flex items-center justify-end px-2 border-r border-b-2 border-border min-w-[100px] flex-1 dark:border-border/80 bg-white dark:bg-background">
                  <button
                    onClick={() => setIsAddColumnDialogOpen(true)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent/20 rounded-md transition-colors"
                    title="Add Column"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body container that scrolls both horizontally and vertically */}
            <div ref={parentRef} className="flex-1 overflow-auto scrollbar-thin" onScroll={(e) => {
              // Sync header scroll with body scroll
              const headerContainer = e.currentTarget.previousElementSibling;
              if (headerContainer) {
                headerContainer.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: totalWidth,
                  position: 'relative',
                }}
              >
                <SortableContext
                  items={flatData.map((_, index) => index.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = flatData[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.index}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="absolute top-0 left-0 flex min-h-[40px] w-full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {columns.map((column: Column) => {
                          const hasError = errors[virtualRow.index.toString()]?.[column.id];
                          return (
                            <div
                              key={column.id}
                              className="relative flex-shrink-0"
                              style={{ 
                                width: column.width,
                                borderRight: '1px solid hsl(var(--border) / 0.8)',
                                borderBottom: '1px solid hsl(var(--border) / 0.8)',
                                background: 'white',
                              }}
                            >
                              <div className="h-full relative">
                                {hasError && (
                                  <div className="absolute -top-5 left-0 text-xs text-white bg-red-500 px-2 py-1 z-50 whitespace-nowrap shadow-sm border border-red-400 rounded-md">
                                    {errors[virtualRow.index.toString()][column.id]}
                                  </div>
                                )}
                                <div className={`absolute inset-0 pointer-events-none border-2 transition-colors rounded-sm ${
                                  hasError ? 'border-red-500/50' : 'border-transparent'
                                }`} />
                                <input
                                  type="text"
                                  value={row?.data[column.id] || ''}
                                  onChange={(e) => updateCell(virtualRow.index, column.id, e.target.value)}
                                  className="absolute inset-0 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-accent/5 rounded-none px-4 py-2 w-full focus:z-30 text-foreground dark:hover:bg-accent/20 dark:focus:ring-primary/40"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {/* Empty space */}
                        <div className="border-r min-w-[100px] flex-1 bg-white dark:bg-background dark:border-border/80" />
                      </div>
                    );
                  })}
                </SortableContext>
              </div>
            </div>
          </div>

          {/* Add Row button */}
          <div className="flex-shrink-0">
            <div className="flex justify-left border-t border-border p-2 min-w-full dark:border-border/40" style={{ background: 'hsl(var(--background))' }}>
              <button
                onClick={addRow}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary px-2 py-1 hover:bg-accent/10 rounded-md transition-colors"
                title="Add Row"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add row</span>
              </button>
            </div>
          </div>
        </div>
      </DndContext>

      <AddColumnDialog
        isOpen={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onSubmit={handleAddColumn}
        isLoading={addColumnMutation.isPending}
      />
    </div>
  );
} 