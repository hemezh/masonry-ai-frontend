import { useState, useCallback, useRef, useEffect } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi, type ColumnType } from '@/lib/api/tables';
import { AddColumnDialog } from './add-column-dialog';
import { useToast } from '@/components/ui/use-toast';
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
  data: Record<string, any>[];
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
  } = useSortable({ id: column.id.toString() });

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
            <div className="w-px h-4 bg-border group-hover:bg-primary/25 transition-colors" />
          </div>
        }
        className="relative"
      >
        <div
          className="h-full relative flex-shrink-0 group"
          style={{ 
            width: column.width,
            borderRight: '1px solid var(--border-color, #E5E7EB)',
            borderBottom: '2px solid var(--border-color, #E5E7EB)',
            background: 'hsl(var(--background))'
          }}
        >
          <div 
            className="flex items-center h-full w-full cursor-move relative hover:bg-accent/50 transition-colors"
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
  } = useSortable({ id: rowIndex.toString() });

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

export function ResizableTable({ workspaceId, tableId: tableId, columns: initialColumns, data: initialData, onColumnResize }: ResizableTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [columnOrder, setColumnOrder] = useState(() => 
    initialColumns.map(col => col.id.toString())
  );
  const [data, setData] = useState(initialData);
  const [totalWidth, setTotalWidth] = useState(() => 
    initialColumns.reduce((sum, col) => sum + col.width, 0) + 100
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const dataRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>(null);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const pendingUpdatesRef = useRef<Record<number, Record<string, any>>>({});

  // Update local state when props change
  useEffect(() => {
    setColumns(initialColumns);
    setColumnOrder(initialColumns.map(col => col.id.toString()));
    setTotalWidth(initialColumns.reduce((sum, col) => sum + col.width, 0) + 100);
  }, [initialColumns]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
      queryClient.setQueryData(['table-data', tableId], (old: any[]) => {
        return old?.map(row => {
          if (row.id === dataId) {
            return {
              ...row,
              data: Object.entries(data).reduce((acc, [key, value]) => {
                acc[`${key}_${columns.find(col => col.id === key)?.type || 's'}`] = value;
                return acc;
              }, {} as Record<string, any>)
            };
          }
          return row;
        });
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['table-data', tableId], context.previousData);
      }
      setIsSaving(false);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
      console.error('Error updating table data:', err);
    },
    onSuccess: () => {
      setIsSaving(false);
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
      });
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
      toast({
        title: 'Success',
        description: 'Row added successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error adding row:', error);
      toast({
        title: 'Error',
        description: 'Failed to add row',
        variant: 'destructive',
      });
    },
  });

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: (data: { name: string; type: ColumnType; description?: string }) => 
      tablesApi.addColumn(workspaceId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setIsAddColumnDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Column added successfully',
      });
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

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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

  // Add validation function
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
    const newData = [...data];
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    // Always update the display value first for immediate feedback
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnId]: value
    };
    setData(newData);

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
      const dataId = (newData[rowIndex] as any).id;
      if (dataId) {
        // Get or initialize the pending updates for this row
        const currentUpdates = pendingUpdatesRef.current[dataId] || {};
        
        // Add the updated field with converted value
        const actualColumnId = parseInt(column.id);
        currentUpdates[actualColumnId.toString()] = validation.convertedValue;

        // Add other fields that are not being updated
        Object.entries(newData[rowIndex]).forEach(([key, val]) => {
          if (key !== columnId && key !== 'id') {
            const col = columns.find(c => c.id === key);
            if (col) {
              const colId = parseInt(col.id);
              if (!currentUpdates[colId.toString()]) {
                // Convert existing values too
                const existingValidation = validateValue(val, col.type);
                currentUpdates[colId.toString()] = existingValidation.convertedValue;
              }
            }
          }
        });

        // Store the updates
        pendingUpdatesRef.current[dataId] = currentUpdates;

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

      // Reorder data in each row according to new column order
      const newData = data.map(row => {
        const reorderedRow = {} as Record<string, any>;
        // Add columns in new order
        newOrder.forEach(columnId => {
          // Just use column ID as the key
          reorderedRow[columnId] = row[columnId];
        });
        return reorderedRow;
      });
      
      setData(newData);
    }
  };

  // Get ordered columns for display
  const orderedColumns = columnOrder.map(id => 
    columns.find(col => col.id.toString() === id)!
  );

  return (
    <div className="relative h-[calc(100vh-12rem)] p-1 rounded-lg overflow-hidden border shadow-sm">
      {isSaving && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-sm rounded-md font-medium border border-emerald-200/50 shadow-sm">
          Saving changes...
        </div>
      )}
      <div className="absolute inset-0 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-border/60 [scrollbar-gutter:stable]">
          <style jsx global>{`
            .scrollbar-thin {
              scrollbar-width: thin;
            }
            .scrollbar-thin::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: transparent;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 4px;
            }
            .scrollbar-thin:hover::-webkit-scrollbar-thumb {
              background: hsl(var(--border));
            }
            .scrollbar-thin::-webkit-scrollbar-corner {
              background: transparent;
            }
          `}</style>
          <div className="min-w-full">
            {/* Header row */}
            <div className="flex min-h-[40px] sticky top-0 z-10  shadow-sm">
              <div className="flex flex-1 " style={{ width: totalWidth, background: 'hsl(var(--background))' }}>
                {columns.map((column: Column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    onResize={(width) => {
                      // Update only the resized column's width
                      const newColumns = columns.map(col => 
                        col.id === column.id ? { ...col, width } : col
                      );
                      
                      // Calculate new total width by summing all column widths
                      const newTotalWidth = newColumns.reduce((sum, col) => sum + col.width, 0) + 100;
                      setTotalWidth(newTotalWidth);
                      setColumns(newColumns);
                      
                      // Debounced API call to save width
                      debouncedUpdateWidth(column.id.toString(), width);
                      
                      // Only notify parent of resize without expecting an API call
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
                        className="absolute inset-0 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/10 rounded-none px-4 py-2 w-full focus:z-30 text-foreground font-medium"
                      />
                      <span className="pointer-events-none px-4 py-2 w-full truncate font-medium text-foreground">
                        {column.header}
                      </span>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4/5 bg-border opacity-50 group-hover:opacity-100" />
                    </div>
                  </SortableColumn>
                ))}
                {/* Add Column button */}
                <div 
                  className="flex items-center justify-end px-2 border-r border-b-2 border-border min-w-[100px] flex-1"
                  style={{ background: 'hsl(var(--background))' }}
                >
                  <button
                    onClick={() => setIsAddColumnDialogOpen(true)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-background/80 rounded-md transition-colors"
                    title="Add Column"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Data rows */}
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex min-h-[40px] relative group">
                <div 
                  className="flex flex-1 border-b hover:bg-accent/5 transition-colors bg-white" 
                  style={{ width: totalWidth }}
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
            ))}
          </div>
        </div>

        {/* Add Row button */}
        <div className="flex-shrink-0">
          <div className="flex justify-left border-t border-border p-2 min-w-full" style={{ background: 'hsl(var(--background))' }}>
            <button
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary px-2 py-1 hover:bg-background/80 rounded-md transition-colors"
              title="Add Row"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add row</span>
            </button>
          </div>
        </div>
      </div>

      <AddColumnDialog
        isOpen={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onSubmit={handleAddColumn}
        isLoading={addColumnMutation.isPending}
      />
    </div>
  );
} 