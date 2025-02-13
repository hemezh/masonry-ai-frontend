import { TableCellsIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table } from '@/lib/api/tables';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TableListProps {
  tables: Table[];
  isLoading: boolean;
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
  onArchive?: (table: Table) => void;
  onUnarchive?: (table: Table) => void;
}

export function TableList({ 
  tables, 
  isLoading, 
  onEdit, 
  onDelete,
  onArchive,
  onUnarchive,
}: TableListProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[240px] rounded-lg border bg-card p-6 flex items-center justify-center dark:bg-white/[.08] dark:shadow-lg">
            <div className="animate-pulse text-muted-foreground dark:text-slate-300">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <div 
          key={table.id} 
          className={`group relative h-[240px] rounded-lg border border-border/40 bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-border/80 dark:bg-white/[.08] dark:hover:bg-white/[.12] dark:shadow-lg dark:hover:border-border/80 flex flex-col dark:hover:shadow-xl ${
            table.archived ? 'opacity-75' : ''
          }`}
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center dark:bg-primary/30">
                <TableCellsIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center text-xs dark:text-slate-300">
                <span className="font-medium">{table.columns?.columns?.length || 0}</span>
                <span className="ml-1">columns</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(table);
                }}>
                  Edit
                </DropdownMenuItem>
                {(onArchive || onUnarchive) && (
                  <>
                    <DropdownMenuSeparator />
                    {table.archived ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnarchive?.(table);
                        }}
                      >
                        Unarchive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive?.(table);
                        }}
                      >
                        Archive
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(table);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            onClick={() => router.push(`/dashboard/tables/${table.id}`)}
            className="absolute inset-0 z-0"
          >
            <span className="sr-only">View table {table.name}</span>
          </button>
          <div className="mt-3 relative z-10 pointer-events-none flex-1">
            <h3 className="font-medium text-foreground dark:text-slate-100">
              {table.name}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground dark:text-slate-300 line-clamp-2">
              {table.description || 'No description'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground dark:text-slate-400 border-t border-border/40 dark:border-slate-600 pt-2 mt-auto relative z-10 pointer-events-none">
            Updated {formatDate(table.updated_at)}
          </div>
        </div>
      ))}
    </div>
  );
} 