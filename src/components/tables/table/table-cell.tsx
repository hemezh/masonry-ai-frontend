'use client';

import { Column } from './types';

interface TableCellProps {
  column: Column;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TableCell({ column, value, onChange, error }: TableCellProps) {
  return (
    <div
      className="relative flex-shrink-0 border-r border-b border-border group"
      style={{ 
        width: column.width,
        background: column.color || 'transparent',
      }}
    >
      <div className="h-full relative">
        {error && (
          <div className="absolute -top-4 left-0 text-[10px] text-destructive bg-destructive/5 px-1.5 py-0.5 z-50 whitespace-nowrap rounded-sm border border-destructive/20">
            {error}
          </div>
        )}
        <div className={`absolute inset-0 ${
          error ? 'ring-1 ring-destructive/30' : 'group-focus-within:ring-1 group-focus-within:ring-primary/20'
        }`} />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 bg-transparent border-none focus:outline-none hover:bg-accent/5 rounded-none px-3 py-2 w-full focus:z-30 text-sm text-foreground/90 dark:hover:bg-accent/10 placeholder:text-muted-foreground/50"
          style={{ color: column.textColor || 'inherit' }}
          placeholder="Empty"
        />
        <div
          className="absolute inset-0 px-3 py-2 truncate pointer-events-none text-sm"
          style={{ color: column.textColor || 'inherit' }}
        >
          {value || ''}
        </div>
      </div>
    </div>
  );
}
