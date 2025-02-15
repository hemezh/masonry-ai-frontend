import { Button } from '@/components/ui/button';
import { Task } from '@/types/task-api';

interface TaskFiltersProps {
    statusFilter: 'all' | Task['status'];
    onFilterChange: (status: 'all' | Task['status']) => void;
}

export function TaskFilters({ statusFilter, onFilterChange }: TaskFiltersProps) {
    return (
        <div className="mb-4 flex gap-2">
            <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => onFilterChange('all')}
                size='sm'
            >
                All
            </Button>
            <Button 
                variant={statusFilter === 'Draft' ? 'default' : 'outline'}
                onClick={() => onFilterChange('Draft')}
                size='sm'
            >
                Draft
            </Button>
            <Button 
                variant={statusFilter === 'Active' ? 'default' : 'outline'}
                onClick={() => onFilterChange('Active')}
                size='sm'
            >
                Active
            </Button>
            <Button 
                variant={statusFilter === 'Archived' ? 'default' : 'outline'}
                onClick={() => onFilterChange('Archived')}
                size='sm'
            >
                Archived
            </Button>
        </div>
    );
} 