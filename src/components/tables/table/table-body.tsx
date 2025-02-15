'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, TableRow, TableErrors } from './types';
import { TableCell } from './table-cell';

interface TableBodyProps {
  parentRef: React.RefObject<HTMLDivElement>;
  columns: Column[];
  rows: TableRow[];
  totalWidth: number;
  errors: TableErrors;
  onUpdateCell: (rowIndex: number, columnId: string, value: string) => void;
}

export function TableBody({
  parentRef,
  columns,
  rows,
  totalWidth,
  errors,
  onUpdateCell,
}: TableBodyProps) {
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current!,
    estimateSize: () => 36,
    overscan: 10,
  });

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent/30 hover:scrollbar-thumb-accent/50" 
      onScroll={(e) => {
        // Sync header scroll with body scroll
        const headerContainer = e.currentTarget.previousElementSibling;
        if (headerContainer) {
          headerContainer.scrollLeft = e.currentTarget.scrollLeft;
        }
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: totalWidth + 48, // Add width for row numbers
          position: 'relative',
        }}
      >
        <SortableContext
          items={rows.map((_, index) => index.toString())}
          strategy={verticalListSortingStrategy}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 flex h-9 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Row number */}
                <div className="flex-shrink-0 w-12 border-r border-b border-border bg-muted/30">
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    {virtualRow.index + 1}
                  </div>
                </div>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    column={column}
                    value={row?.data[column.id] || ''}
                    onChange={(value) => onUpdateCell(virtualRow.index, column.id, value)}
                    error={errors[virtualRow.index.toString()]?.[column.id]}
                  />
                ))}
                {/* Empty space */}
                <div className="min-w-[100px] flex-1 border-border/30" />
              </div>
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}
