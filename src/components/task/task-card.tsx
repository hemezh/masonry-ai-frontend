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

export function TaskCard({ task, index, onDelete, onConfigureClick }: TaskCardProps) {
    const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [latestExecution, setLatestExecution] = useState<TaskExecution | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Generate accent color with reduced saturation
    const hue = (index * 137.508) % 360;
    const accentColor = `hsl(${hue}, 45%, 55%)`;

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

        const statusConfig = {
            pending: { bg: 'bg-zinc-100', text: 'text-zinc-800' },
            running: { bg: 'bg-blue-50', text: 'text-blue-700' },
            completed: { bg: 'bg-green-50', text: 'text-green-700' },
            failed: { bg: 'bg-red-50', text: 'text-red-700' }
        };

        const config = statusConfig[latestExecution.status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <ClockIcon className="h-3 w-3" />
                {latestExecution.status}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg border border-zinc-200 p-3 relative h-48 flex flex-col overflow-hidden">
            {/* Accent border */}
            <div 
                className="absolute left-0 top-0 rounded-lg bottom-0 w-0.5" 
                style={{ backgroundColor: accentColor }} 
            />
            
            {/* Status badges */}
            <div className="flex items-center gap-2 mb-2 ">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'Active' ? 'bg-green-50 text-green-700' :
                    'bg-zinc-50 text-zinc-700 border border-zinc-200'
                }`}>
                    {task.status}
                </span>
                {/* {getStatusBadge()} */}
            </div>

            {/* Header section */}
            <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 text-sm mb-0.5 line-clamp-1">
                        {toTitleCase(task.name)}
                    </h3>
                    <span className="text-xs text-zinc-400 font-mono">
                        {task.id}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                        >
                            <EllipsisVerticalIcon className="h-4 w-4 text-zinc-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                            onClick={() => onDelete(task.id)} 
                            className="text-red-600"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            {/* Description - Fixed visibility */}
            <div className="flex-1">
                <p className="text-sm text-zinc-600 leading-normal line-clamp-2 overflow-hidden">
                    {task.description}
                </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
                <Button 
                    variant="default" 
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleExecute}
                    disabled={isPolling}
                >
                    <PlayIcon className="h-3.5 w-3.5 mr-1.5" />
                    Execute
                </Button>

                {hasConfigFields(task) && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onConfigureClick(task)}
                    >
                        <Cog6ToothIcon className="h-3.5 w-3.5 mr-1.5" />
                        Configure
                    </Button>
                )}

                <Button 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs"
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