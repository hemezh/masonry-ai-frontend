import { useState, useCallback, useRef, useEffect } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { PlusIcon, SwatchIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

// Predefined colors for columns
const COLUMN_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#fca5a5' },
  { name: 'Orange', value: '#fdba74' },
  { name: 'Yellow', value: '#fde047' },
  { name: 'Green', value: '#86efac' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Purple', value: '#d8b4fe' },
  { name: 'Pink', value: '#f9a8d4' },
];

// Predefined text colors for columns
const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
];

interface Column {
  id: string;
  name?: string;
  header: string;
  width: number;
  type: ColumnType;
  minWidth?: number;
  color?: string;
  textColor?: string;
  text_color?: string;
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
            <div className="w-px h-4 bg-border dark:bg-border group-hover:bg-primary/25 transition-colors" />
          </div>
        }
        className="relative"
      >
        <div
          className="h-full relative flex-shrink-0 group"
          style={{ 
            width: column.width,
            borderRight: '1px solid var(--table-border-color)',
            borderBottom: '1px solid var(--table-border-color)',
            background: column.color || 'hsl(var(--background))'
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
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [newColumnName, setNewColumnName] = useState('');

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
    setColumns(initialColumns.map(col => ({
      ...col,
      header: col.name || col.header, // Handle both name and header properties
      color: col.color,
      textColor: col.text_color || col.textColor || '', // Handle both snake_case and camelCase, default to empty string
    })));
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

  // Add mutation for updating column color
  const updateColumnColorMutation = useMutation({
    mutationFn: ({ columnId, color, textColor }: { columnId: string; color?: string; textColor?: string }) => 
      tablesApi.updateColumn(workspaceId, tableId, columnId, { color, textColor }),
    onMutate: async ({ columnId, color, textColor }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['table', tableId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['table', tableId]);

      // Update both local state and query cache
      const updateColumns = (cols: Column[]) => 
        cols.map(col => col.id === columnId ? { 
          ...col, 
          ...(color !== undefined ? { color } : {}),
          ...(textColor !== undefined ? { textColor } : {})
        } : col);

      // Update local state
      setColumns(prev => updateColumns(prev));

      // Update query cache
      queryClient.setQueryData(['table', tableId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          columns: {
            ...old.columns,
            columns: updateColumns(old.columns.columns),
          },
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        // Restore both states
        queryClient.setQueryData(['table', tableId], context.previousData);
        const previousColumns = (context.previousData as any)?.columns?.columns || [];
        setColumns(previousColumns);
      }
      toast.error('Failed to update column color');
    },
    onSuccess: () => {
      toast.success('Column color updated');
    },
  });

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

  const handleRename = () => {
    if (!selectedColumn || !newColumnName.trim()) return;
    
    const newColumns = columns.map(col =>
      col.id === selectedColumn.id ? { ...col, header: newColumnName } : col
    );
    setColumns(newColumns);
    updateColumnMutation.mutate({
      columnId: selectedColumn.id.toString(),
      name: newColumnName,
    });
    setIsRenameDialogOpen(false);
  };

  // Get ordered columns for display
  const orderedColumns = columnOrder.map(id => 
    columns.find(col => col.id.toString() === id)!
  );

  return (
    <div className="relative h-[calc(100vh-12rem)] p-1 rounded-lg overflow-hidden border shadow-sm" style={{ border: '1px solid var(--table-border-color)', backgroundColor: 'var(--table-background-color)', color: 'var(--table-text-color)' }}>
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
              <div className="flex" style={{ width: totalWidth + 40 /* 40 is added to account for the scrollbar, offsetted below the header add button */, background: 'white',  }}>
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
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="px-4 py-2 truncate font-medium text-foreground" style={{ 
                            color: column.textColor || 'inherit'
                          }}>
                            {column.header}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md hover:bg-accent/50 transition-colors hover:opacity-100"
                                style={{ color: column.textColor || 'inherit' }}
                              >
                                <ChevronDownIcon className="h-4 w-4" color={column.textColor || 'inherit' } />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedColumn(column);
                                  setNewColumnName(column.header);
                                  setIsRenameDialogOpen(true);
                                }}
                              >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <SwatchIcon className="h-4 w-4 mr-2" />
                                  Set Background Color
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="p-1">
                                  <div className="grid grid-cols-4 gap-1">
                                    {COLUMN_COLORS.map((color) => (
                                      <button
                                        key={color.value}
                                        className={`w-8 h-8 rounded-md border transition-all ${
                                          column.color === color.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                                        }`}
                                        style={{ 
                                          background: color.value || 'hsl(var(--background))',
                                          borderColor: 'hsl(var(--border))'
                                        }}
                                        title={color.name}
                                        onClick={() => {
                                          updateColumnColorMutation.mutate({
                                            columnId: column.id,
                                            color: color.value,
                                          });
                                        }}
                                      />
                                    ))}
                                  </div>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <SwatchIcon className="h-4 w-4 mr-2" />
                                  Set Text Color
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="p-1">
                                  <div className="grid grid-cols-4 gap-1">
                                    {TEXT_COLORS.map((color) => (
                                      <button
                                        key={color.value}
                                        className={`w-8 h-8 rounded-md border transition-all ${
                                          column.textColor === color.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                                        }`}
                                        style={{ 
                                          background: color.value || 'hsl(var(--background))',
                                          borderColor: 'hsl(var(--border))'
                                        }}
                                        title={color.name}
                                        onClick={() => {
                                          updateColumnColorMutation.mutate({
                                            columnId: column.id,
                                            textColor: color.value,
                                          });
                                        }}
                                      />
                                    ))}
                                  </div>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4/5 bg-border opacity-50 group-hover:opacity-100 dark:bg-border/80" />
                      </div>
                    </SortableColumn>
                  ))}
                </SortableContext>
                {/* Add Column button */}
                <div className="flex items-center justify-end px-2 border-r border-b-2 border-border min-w-[100px] flex-1 dark:border-border/80 bg-white dark:bg-background pr-10"
                
                >
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
                                borderRight: '1px solid var(--table-border-color)',
                                borderBottom: '1px solid var(--table-border-color)',
                                background: column.color || 'var(--table-background-color)',
                              }}
                            >
                              <div className="h-full relative">
                                {hasError && (
                                  <div className="absolute -top-5 left-0 text-xs text-white bg-red-500 px-2 py-1 z-50 whitespace-nowrap shadow-sm border border-red-400 rounded-md">
                                    {errors[virtualRow.index.toString()][column.id]}
                                  </div>
                                )}
                                <div className={`absolute inset-0 border ${
                                  hasError ? 'border-red-500/50' : 'border-transparent'
                                }`} />
                                <input
                                  type="text"
                                  value={row?.data[column.id] || ''}
                                  onChange={(e) => updateCell(virtualRow.index, column.id, e.target.value)}
                                  className="absolute inset-0 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-accent/5 rounded-none px-4 py-2 w-full focus:z-30 text-foreground dark:hover:bg-accent/20 dark:focus:ring-primary/40"
                                  style={{ color: column.textColor || 'inherit' }}
                                />
                                <div
                                  className="absolute inset-0 px-4 py-2 truncate pointer-events-none"
                                  style={{ color: column.textColor || 'inherit' }}
                                >
                                  {row?.data[column.id] || ''}
                                </div>
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

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter column name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddColumnDialog
        isOpen={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onSubmit={handleAddColumn}
        isLoading={addColumnMutation.isPending}
      />
    </div>
  );
} 