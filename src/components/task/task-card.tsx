import { useState, useEffect } from 'react';
import { EllipsisVerticalIcon, PlayIcon, TrashIcon, Cog6ToothIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Task, TaskExecution } from '@/types/task-api';
import { taskService } from '@/services/task-service';
import { TaskExecuteModal } from './task-execute-modal';
import { TaskExecutionModal } from './task-execution-modal';

interface TaskCardProps {
    task: Task;
    index: number;
    onDelete: (taskId: string) => void;
    onConfigureClick: (task: Task) => void;
}

const toTitleCase = (str: string) => {
    return str
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const hasConfigFields = (task: Task) => {
    return task.config_schema?.properties && Object.keys(task.config_schema.properties).length > 0;
};

const TASK_STATUS_STYLES = {
    Active: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
    Draft: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300' },
    Archived: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-400' },
} as const;

const EXECUTION_STATUS_STYLES = {
    completed: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
    failed: { bg: 'bg-destructive/10', text: 'text-destructive' },
    running: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300' },
} as const;

export function TaskCard({ task, index, onDelete, onConfigureClick }: TaskCardProps) {
    const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [latestExecution, setLatestExecution] = useState<TaskExecution | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Use theme chart colors for variety
    const chartColors = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)'
    ];
    const accentColor = chartColors[index % chartColors.length];

    const handleExecute = () => {
        setIsExecuteModalOpen(true);
    };

    const handleExecuted = (execution: TaskExecution) => {
        if (!execution) return;
        setLatestExecution(execution);
        setIsPolling(execution.status !== 'completed' && execution.status !== 'failed');
        setIsHistoryModalOpen(true);
    };

    useEffect(() => {
        if (!latestExecution || ['completed', 'failed'].includes(latestExecution.status)) {
            setIsPolling(false);
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                const execution = await taskService.getExecution(latestExecution.id);
                setLatestExecution(execution);
                if (['completed', 'failed'].includes(execution.status)) {
                    setIsPolling(false);
                }
            } catch (error) {
                setIsPolling(false);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [latestExecution?.id]);

    const getStatusBadge = () => {
        if (!latestExecution) return null;

        const config = EXECUTION_STATUS_STYLES[latestExecution.status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <ClockIcon className="h-3 w-3" />
                {latestExecution.status}
            </span>
        );
    };

    const statusStyle = TASK_STATUS_STYLES[task.status as keyof typeof TASK_STATUS_STYLES];

    return (
        <div className="bg-card dark:bg-background rounded-lg border border-border/60 shadow-sm p-3 relative h-48 flex flex-col overflow-hidden transition-all hover:shadow-md">
            {/* Accent border */}
            <div 
                className="absolute left-0 top-0 rounded-tl-lg rounded-bl-lg bottom-0 w-1 opacity-60" 
                style={{ backgroundColor: accentColor }} 
            />
            
            {/* Status badges */}
            <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {task.status}
                </span>
                {getStatusBadge()}
            </div>

            {/* Header section */}
            <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-0.5 line-clamp-1">
                        {toTitleCase(task.name)}
                    </h3>
                    <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tight">
                        {task.id}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-accent/50"
                        >
                            <EllipsisVerticalIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                            onClick={() => onDelete(task.id)} 
                            className="text-destructive focus:text-destructive"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* Description */}
            <div className="flex-1">
                <p className="text-sm text-muted-foreground/90 leading-normal line-clamp-2 overflow-hidden">
                    {task.description}
                </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
                <Button 
                    variant="default" 
                    size="sm"
                    className="h-7 text-xs shadow-sm"
                    onClick={handleExecute}
                    disabled={isPolling}
                >
                    <PlayIcon className="h-3.5 w-3.5 mr-1.5" />
                    Execute
                </Button>

                {hasConfigFields(task) && (
                    <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-7 text-xs shadow-sm"
                        onClick={() => onConfigureClick(task)}
                    >
                        <Cog6ToothIcon className="h-3.5 w-3.5 mr-1.5" />
                        Configure
                    </Button>
                )}

                <Button 
                    variant="secondary" 
                    size="sm"
                    className="h-7 text-xs shadow-sm"
                    onClick={() => setIsHistoryModalOpen(true)}
                >
                    <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                    View Executions
                </Button>
            </div>

            <TaskExecuteModal
                task={task}
                isOpen={isExecuteModalOpen}
                onClose={() => setIsExecuteModalOpen(false)}
                onExecuted={handleExecuted}
            />

            <TaskExecutionModal
                taskId={task.id}
                outputSchema={task.output_schema}
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
            />
        </div>
    );
}