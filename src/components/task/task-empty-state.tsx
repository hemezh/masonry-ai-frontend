import { Task } from '@/types/task-api';

interface TaskEmptyStateProps {
    statusFilter: 'all' | Task['status'];
}

export function TaskEmptyState({ statusFilter }: TaskEmptyStateProps) {
    return (
        <div className="text-center py-8">
            <h3 className="text-sm font-medium text-foreground mb-1">No tasks found</h3>
            <p className="text-sm text-muted-foreground">
                {statusFilter === 'all' 
                    ? "Get started by creating your first task"
                    : `No ${statusFilter} tasks found`}
            </p>
        </div>
    );
} 