import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface TaskHeaderProps {
    onCreateTask?: () => void;
}

export function TaskHeader({ onCreateTask }: TaskHeaderProps) {
    return (
        <div className="mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900">Tasks</h1>
                <p className="text-sm text-zinc-500">Manage your automation tasks</p>
            </div>
            <Button variant="default" size="sm" onClick={onCreateTask}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Task
            </Button>
        </div>
    );
} 