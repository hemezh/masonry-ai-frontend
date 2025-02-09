import { Task } from '@/types/task-api';
import { TaskCard } from './task-card';

interface TaskListProps {
    tasks: Task[];
    isLoading: boolean;
    onDelete: (taskId: string) => void;
    onConfigureClick: (task: Task) => void;
}

export function TaskList({ tasks, isLoading, onDelete, onConfigureClick }: TaskListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background rounded-lg border border-border p-4 animate-pulse">
                        <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tasks.map((task, index) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onDelete={onDelete}
                    onConfigureClick={onConfigureClick}
                />
            ))}
        </div>
    );
} 