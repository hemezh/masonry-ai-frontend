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
            <>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background rounded-lg border border-border/40 shadow-sm p-4 h-48 relative">
                        <div className="absolute left-0 top-0 rounded-tl-lg rounded-bl-lg bottom-0 w-1 bg-muted/60"></div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-5 bg-secondary rounded-full w-16 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-secondary rounded w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-secondary rounded w-1/2 animate-pulse"></div>
                            </div>
                            <div className="h-16 bg-secondary rounded animate-pulse"></div>
                            <div className="flex gap-2">
                                <div className="h-7 bg-secondary rounded w-24 animate-pulse"></div>
                                <div className="h-7 bg-secondary rounded w-32 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    }

    if (tasks.length === 0) {
        return null;
    }

    return (
        <>
            {tasks.map((task, index) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onDelete={onDelete}
                    onConfigureClick={onConfigureClick}
                />
            ))}
        </>
    );
} 