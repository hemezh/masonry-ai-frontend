import { useState, useCallback, useRef, useEffect } from 'react';
import { Resizable } from 'react-resizable';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import 'react-resizable/css/styles.css';

interface Column {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
}

interface ResizableSheetProps {
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
  } = useSortable({ id: column.id });

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
        onResize={(e, { size }) => onResize(size.width)}
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
          {columns.map((column) => (
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
                  className="absolute inset-0 bg-gray-50 border-none focus:outline-none focus:ring-0 focus:bg-white rounded-none px-4 py-2 w-full focus:z-30 transition-colors"
                />
                <span className="pointer-events-none px-4 py-2">
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

export function ResizableSheet({ columns: initialColumns, data: initialData, onColumnResize }: ResizableSheetProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [columnOrder, setColumnOrder] = useState(() => 
    initialColumns.map(col => col.id)
  );
  const [data, setData] = useState(initialData);
  const [totalWidth, setTotalWidth] = useState(() => 
    initialColumns.reduce((sum, col) => sum + col.width, 0) + 100
  );
  const dataRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

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

  const handleResize = useCallback((columnId: string) => (
    event: React.SyntheticEvent,
    { size }: { size: { width: number; height: number } }
  ) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return { ...col, width: size.width };
      }
      return col;
    });
    
    const newTotalWidth = newColumns.reduce((sum, col) => sum + col.width, 0) + 100;
    setTotalWidth(newTotalWidth);
    setColumns(newColumns);
    onColumnResize?.(columnId, size.width);
  }, [columns, onColumnResize]);

  const addColumn = () => {
    const columnId = `col-${columns.length + 1}`;
    const newColumn: Column = {
      id: columnId,
      header: `Column ${columns.length + 1}`,
      width: 150,
      minWidth: 100,
    };
    
    setColumns([...columns, newColumn]);
    // Add the new column to existing rows with empty values
    setData(data.map(row => ({
      ...row,
      [columnId]: ''
    })));
  };

  const addRow = () => {
    const newRow = columns.reduce((acc, col) => ({
      ...acc,
      [col.id]: ''
    }), {});
    setData([...data, newRow]);
  };

  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnId]: value
    };
    setData(newData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (typeof active.id === 'string' && typeof over.id === 'string' && active.id.startsWith('col-')) {
      // Handle column reordering
      const oldIndex = columnOrder.indexOf(active.id);
      const newIndex = columnOrder.indexOf(over.id);
      
      const newOrder = [...columnOrder];
      const [movedColumn] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedColumn);
      
      // Update column order
      setColumnOrder(newOrder);

      // Reorder data in each row according to new column order
      const newData = data.map(row => {
        const reorderedRow = {} as Record<string, any>;
        // Add columns in new order
        newOrder.forEach(columnId => {
          reorderedRow[columnId] = row[columnId];
        });
        return reorderedRow;
      });
      
      setData(newData);
    }
  };

  // Get ordered columns for display
  const orderedColumns = columnOrder.map(id => 
    columns.find(col => col.id === id)!
  );

  return (
    <div className="relative h-[calc(100vh-12rem)] p-1">
      <div className="absolute inset-0 border rounded-lg flex flex-col overflow-hidden bg-background shadow-md">
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {/* Header row */}
            <div className="flex min-h-[40px] relative">
              <div className="flex flex-1 bg-card border-b border-border" style={{ width: totalWidth }}>
                {columns.map((column) => (
                  <Resizable
                    key={column.id}
                    width={column.width}
                    height={40}
                    minConstraints={[column.minWidth || 100, 40]}
                    onResize={handleResize(column.id)}
                    draggableOpts={{ enableUserSelectHack: false }}
                    className="relative"
                  >
                    <div
                      className="h-full relative flex-shrink-0 border-r border-border"
                      style={{ width: column.width }}
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
                          }}
                          className="absolute inset-0 bg-card border-none focus:outline-none focus:ring-0 focus:bg-background rounded-none px-4 py-2 w-full focus:z-30 transition-colors text-card-foreground"
                        />
                        <span className="pointer-events-none px-4 font-medium text-card-foreground">
                          {column.header}
                        </span>
                      </div>
                    </div>
                  </Resizable>
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
                  {columns.map((column) => (
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