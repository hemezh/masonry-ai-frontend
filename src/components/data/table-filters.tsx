import { Button } from "@/components/ui/button";

export type TableFilter = 'all' | 'archived';

interface TableFiltersProps {
  filter: TableFilter;
  onFilterChange: (filter: TableFilter) => void;
}

export function TableFilters({ filter, onFilterChange }: TableFiltersProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
      >
        All
      </Button>
      <Button
        variant={filter === 'archived' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('archived')}
      >
        Archived
      </Button>
    </div>
  );
} 