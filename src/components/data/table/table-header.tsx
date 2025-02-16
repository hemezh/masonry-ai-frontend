'use client';

import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Column } from './types';
import { ColumnMenu } from './column-menu';
import 'react-resizable/css/styles.css';
import { useState, useEffect, useRef } from 'react';

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
  const [width, setWidth] = useState(column.width);
  const [isResizing, setIsResizing] = useState(false);
  const initialWidth = useRef(column.width);

  useEffect(() => {
    if (!isResizing) {
      setWidth(column.width);
      initialWidth.current = column.width;
    }
  }, [column.width, isResizing]);

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
    transition: isResizing ? undefined : transition,
    zIndex: isDragging ? 1 : 0,
    userSelect: isResizing ? 'none' : undefined,
    webkitUserSelect: isResizing ? 'none' : undefined,
  } as const;

  const handleResize = (e: React.SyntheticEvent, { size }: ResizeCallbackData) => {
    e.preventDefault();
    const newWidth = Math.max(column.minWidth || 100, size.width);
    setWidth(newWidth);
    onResize(newWidth);
  };

  const handleResizeStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    initialWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const handleResizeStop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Resizable
        width={width}
        height={36}
        minConstraints={[column.minWidth || 100, 36]}
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        draggableOpts={{ 
          enableUserSelectHack: false,
        }}
        handle={
          <div 
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-10
              ${isResizing ? 'bg-primary/30' : ''}`}
            onMouseDown={(e) => e.stopPropagation()}
          />
        }
        className="relative select-none"
        resizeHandles={['e']}
        axis="x"
      >
        <div
          className="h-full relative flex-shrink-0 group select-none"
          style={{ width }}
        >
          <div 
            className={`flex items-center h-full w-full cursor-move relative hover:bg-accent/30 dark:hover:bg-accent/10 transition-colors border-r border-border/80
              ${isResizing ? 'select-none' : ''}`}
            {...listeners}
          >
            <div className="flex items-center justify-between w-full">
              <span className="px-3 py-2 truncate text-sm font-medium text-foreground/80">
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
    <div className="sticky top-0 z-10 bg-background border-b border-border/40">
      <div 
        className="overflow-x-auto header-scroll"
        onScroll={(e) => {
          // Sync body scroll with header scroll
          const tableContainer = e.currentTarget.closest('.table-container');
          const bodyScroll = tableContainer?.querySelector('.body-scroll');
          if (bodyScroll && bodyScroll instanceof HTMLElement) {
            bodyScroll.scrollLeft = e.currentTarget.scrollLeft;
          }
        }}
      >
        <div 
          className="flex h-9" 
          style={{ width: totalWidth + 80 }}
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
          <div className="flex items-center justify-start px-2 border-r border-border/30 w-full" >
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
}
