'use client';

import { Resizable } from 'react-resizable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Column } from './types';
import { ColumnMenu } from './column-menu';
import 'react-resizable/css/styles.css';

interface TableHeaderProps {
  columns: Column[];
  onResize: (columnId: string, width: number) => void;
  onRename: (column: Column, newName: string) => void;
  onUpdateColor: (columnId: string, color: string) => void;
  onUpdateTextColor: (columnId: string, textColor: string) => void;
  totalWidth: number;
  children?: React.ReactNode;
}

interface SortableColumnHeaderProps {
  column: Column;
  onResize: (width: number) => void;
  onRename: (column: Column, newName: string) => void;
  onUpdateColor: (columnId: string, color: string) => void;
  onUpdateTextColor: (columnId: string, textColor: string) => void;
}

function SortableColumnHeader({ 
  column, 
  onResize, 
  onRename,
  onUpdateColor,
  onUpdateTextColor,
}: SortableColumnHeaderProps) {
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
        height={36}
        minConstraints={[column.minWidth || 100, 36]}
        onResize={(e, data) => onResize(data.size.width)}
        draggableOpts={{ enableUserSelectHack: false }}
        handle={
          <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group-hover:bg-primary/5 transition-colors z-10" />
        }
        className="relative"
      >
        <div
          className="h-full relative flex-shrink-0 group"
          style={{ width: column.width }}
        >
          <div 
            className="flex items-center h-full w-full cursor-move relative hover:bg-accent/30 dark:hover:bg-accent/10 transition-colors border-r border-border/80"
            {...listeners}
          >
            <div className="flex items-center justify-between w-full">
              <span className="px-3 py-2 truncate text-sm font-medium text-foreground/80" style={{ 
                color: column.textColor || 'inherit'
              }}>
                {column.header}
              </span>
              <ColumnMenu
                column={column}
                onRename={onRename}
                onUpdateColor={onUpdateColor}
                onUpdateTextColor={onUpdateTextColor}
              />
            </div>
          </div>
        </div>
      </Resizable>
    </div>
  );
}

export function TableHeader({
  columns,
  onResize,
  onRename,
  onUpdateColor,
  onUpdateTextColor,
  totalWidth,
  children,
}: TableHeaderProps) {
  return (
    <div className="h-9 sticky top-0 z-10 bg-background border-b border-border/40">
      <div 
        className="flex" 
        style={{ width: totalWidth + 48 }}
      >
        {/* Row number header */}
        <div className="flex-shrink-0 w-12 border-r border-border/30 bg-muted/30">
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            #
          </div>
        </div>
        {columns.map((column) => (
          <SortableColumnHeader
            key={column.id}
            column={column}
            onResize={(width) => onResize(column.id, width)}
            onRename={onRename}
            onUpdateColor={onUpdateColor}
            onUpdateTextColor={onUpdateTextColor}
          />
        ))}
        {/* Add Column button */}
        <div className="flex items-center justify-end px-2 border-r border-border/30">
          {children}
        </div>
      </div>
    </div>
  );
}
