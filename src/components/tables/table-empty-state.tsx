import { TableCellsIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface TableEmptyStateProps {
  onCreateTable: () => void;
  onImportCSV: () => void;
}

export function TableEmptyState({ onCreateTable, onImportCSV }: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 dark:bg-primary/30">
        <TableCellsIcon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">No tables yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm dark:text-slate-300">
        Get started by creating a new table or importing data from a CSV file.
      </p>
      <div className="flex gap-4">
        <Button onClick={onCreateTable} variant="default">
          Create New Table
        </Button>
        <Button onClick={onImportCSV} variant="outline">
          Import CSV
        </Button>
      </div>
    </div>
  );
} 