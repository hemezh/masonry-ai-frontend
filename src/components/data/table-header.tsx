import { PlusIcon } from '@heroicons/react/24/outline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableHeaderProps {
  onCreateTable: () => void;
  onImportCSV: () => void;
}

export function TableHeader({ onCreateTable, onImportCSV }: TableHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tables</h1>
        <p className="text-sm text-muted-foreground">Manage your data tables</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Table
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={onCreateTable}>
            <div className="flex flex-col">
              <span className="font-medium">Blank Table</span>
              <span className="text-xs text-muted-foreground">Start with an empty table</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportCSV}>
            <div className="flex flex-col">
              <span className="font-medium">Import CSV</span>
              <span className="text-xs text-muted-foreground">Create from CSV file</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 