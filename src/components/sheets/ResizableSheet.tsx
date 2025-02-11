import { useState, useCallback, useRef, useEffect } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetsApi, type ColumnType } from '@/lib/api/sheets';
import 'react-resizable/css/styles.css';
import debounce from 'lodash/debounce';

interface Column {
  id: string;
  header: string;
  width: number;
  type: ColumnType;
  minWidth?: number;
}

interface ResizableSheetProps {
  sheetId: string;
  columns: Column[];
  data: Record<string, any>[];
  onColumnResize?: (columnId: string, newWidth: number) => void;
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
        className="relative"
      >
        <div
          className="h-full relative flex-shrink-0 group"
          style={{ 
            width: column.width,
            borderRight: '1px solid var(--border-color, #E5E7EB)',
            borderBottom: '1px solid var(--border-color, #E5E7EB)'
          }}
        >
          <div 
            className="flex items-center h-full cursor-move relative"
            {...listeners}
          >
            {children}
          </div>
        </div>
      </Resizable>
    </div>
  );
}

function SortableRow({ row, rowIndex, columns, updateCell, totalWidth }: SortableRowProps) {
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
          className="flex flex-1 border-b cursor-move" 
          style={{ width: totalWidth }}
          {...listeners}
        >
          {columns.map((column: Column) => (
            <div
              key={column.id}
              className="relative flex-shrink-0"
              style={{ 
                width: column.width,
                borderRight: '1px solid var(--border-color, #E5E7EB)'
              }}
            >
              <div className="h-full relative">
                <input
                  type="text"
                  value={row[column.id] || ''}
                  onChange={(e) => updateCell(rowIndex, column.id, e.target.value)}
                  className="absolute inset-0 bg-background border-none focus:outline-none focus:ring-0 focus:bg-background hover:bg-muted/30 rounded-none px-4 py-2 w-full focus:z-30 transition-colors text-foreground"
                />
                <span className="pointer-events-none px-4 py-2 text-foreground">
                  {row[column.id] || ''}
                </span>
              </div>
            </div>
          ))}
          {/* Empty space to align with header */}
          <div className="border-r min-w-[100px] flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ResizableSheet({ sheetId, columns: initialColumns, data: initialData, onColumnResize }: ResizableSheetProps) {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [columnOrder, setColumnOrder] = useState(() => 
    initialColumns.map(col => col.id.toString())
  );
  const [data, setData] = useState(initialData);
  const [totalWidth, setTotalWidth] = useState(() => 
    initialColumns.reduce((sum, col) => sum + col.width, 0) + 100
  );
  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>(null);

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
      sheetsApi.updateColumn(sheetId, columnId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', sheetId] });
    },
  });

  const reorderColumnsMutation = useMutation({
    mutationFn: (typeKeys: string[]) => 
      sheetsApi.reorderColumns(sheetId, typeKeys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', sheetId] });
    },
  });

  const updateSheetDataMutation = useMutation({
    mutationFn: ({ dataId, data }: { dataId: number; data: Record<string, any> }) => 
      sheetsApi.updateSheetData(sheetId, dataId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-data', sheetId] });
    },
  });

  const createSheetDataMutation = useMutation({
    mutationFn: (data: Record<string, any>) => 
      sheetsApi.createSheetData(sheetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-data', sheetId] });
    },
  });

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: (data: { name: string; type: ColumnType; description?: string }) => 
      sheetsApi.addColumn(sheetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', sheetId] });
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
      return sheetsApi.updateColumn(sheetId, columnId, { width });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet', sheetId] });
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

  const addColumn = () => {
    addColumnMutation.mutate({
      name: 'New Column',
      type: 's',  // Always string type by default
    });
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach((column: Column) => {
      // Just use column ID as the key
      newRow[column.id] = '';
    });
    createSheetDataMutation.mutate(newRow);
  };

  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    const newData = [...data];
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    // Just use column ID as the key
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnId]: value
    };
    setData(newData);

    // Get the data ID from the row
    const dataId = (newData[rowIndex] as any).id;
    if (dataId) {
      updateSheetDataMutation.mutate({
        dataId,
        data: newData[rowIndex],
      });
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
    <div className="relative h-[calc(100vh-12rem)] p-1">
      {isSaving && (
        <div className="absolute top-0 right-0 m-4 px-3 py-1 bg-green-100 text-green-600 text-sm rounded-md font-medium">
          Saving changes...
        </div>
      )}
      <div className="absolute inset-0 border rounded-lg flex flex-col overflow-hidden bg-background shadow-md">
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {/* Header row */}
            <div className="flex min-h-[40px] relative">
              <div className="flex flex-1 bg-card border-b border-border" style={{ width: totalWidth }}>
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
                    <div className="flex items-center h-full cursor-col-resize relative">
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
                        className="absolute inset-0 bg-card border-none focus:outline-none focus:ring-0 focus:bg-background rounded-none px-4 py-2 w-full focus:z-30 transition-colors text-card-foreground"
                      />
                      <span className="pointer-events-none px-4 font-medium text-card-foreground">
                        {column.header}
                      </span>
                    </div>
                  </SortableColumn>
                ))}
                {/* Add Column button */}
                <div 
                  className="flex items-center justify-end px-2 border-r border-b border-border bg-card min-w-[100px] flex-1"
                >
                  <button
                    onClick={addColumn}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="Add Column"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Data rows */}
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex min-h-[40px] relative group">
                <div 
                  className="flex flex-1 border-b border-border hover:bg-muted/20"
                  style={{ width: totalWidth }}
                >
                  {columns.map((column: Column) => (
                    <div
                      key={column.id}
                      className="relative flex-shrink-0 border-r border-border"
                      style={{ width: column.width }}
                    >
                      <div className="h-full relative">
                        <input
                          type="text"
                          value={row[column.id] || ''}
                          onChange={(e) => updateCell(rowIndex, column.id, e.target.value)}
                          className="absolute inset-0 bg-background border-none focus:outline-none focus:ring-0 focus:bg-background hover:bg-muted/30 rounded-none px-4 py-2 w-full focus:z-30 transition-colors text-foreground"
                        />
                        <span className="pointer-events-none px-4 py-2 text-foreground">
                          {row[column.id] || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Empty space */}
                  <div className="border-r border-border min-w-[100px] flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Row button */}
        <div className="flex-shrink-0">
          <div className="flex justify-left border-t border-border bg-card p-2 min-w-full">
            <div>
              <button
                onClick={addRow}
                className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                title="Add Row"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 