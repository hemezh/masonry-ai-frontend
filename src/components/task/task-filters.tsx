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
                variant={statusFilter === 'all' ? 'default' : 'secondary'}
                onClick={() => onFilterChange('all')}
                size='sm'
            >
                All
            </Button>
            <Button 
                variant={statusFilter === 'draft' ? 'default' : 'secondary'}
                onClick={() => onFilterChange('draft')}
                size='sm'
            >
                Draft
            </Button>
            <Button 
                variant={statusFilter === 'active' ? 'default' : 'secondary'}
                onClick={() => onFilterChange('active')}
                size='sm'
            >
                Active
            </Button>
            <Button 
                variant={statusFilter === 'archived' ? 'default' : 'secondary'}
                onClick={() => onFilterChange('archived')}
                size='sm'
            >
                Archived
            </Button>
        </div>
    );
} 