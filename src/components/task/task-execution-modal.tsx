'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskExecution } from '@/types/task-api';
import { taskService } from '@/services/task-service';
import { format } from 'date-fns';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface TaskExecutionModalProps {
    taskId: string;
    outputSchema: Record<string, any>;
    isOpen: boolean;
    onClose: () => void;
}

export function TaskExecutionModal({ taskId, outputSchema, isOpen, onClose }: TaskExecutionModalProps) {
    const [executions, setExecutions] = useState<TaskExecution[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Function to fetch executions
    const fetchExecutions = async () => {
        try {
            console.log(`[TaskExecutionModal] Fetching executions for task: ${taskId}`);
            const data = await taskService.listTaskExecutions(taskId);
            console.log(`[TaskExecutionModal] Received ${data.length} executions`);
            setExecutions(data || []);
            
            // Check if we need to continue polling (any non-terminal executions)
            const hasActiveExecution = data.some(exec => 
                exec.status !== 'completed' && exec.status !== 'failed'
            );
            setIsPolling(hasActiveExecution);
            
            if (hasActiveExecution) {
                console.log(`[TaskExecutionModal] Found active execution, will continue polling`);
            }
        } catch (error) {
            console.error(`[TaskExecutionModal] Failed to fetch executions:`, error);
            setError(error instanceof Error ? error : new Error('Failed to fetch executions'));
        }
    };

    useEffect(() => {
        if (isOpen && taskId) {
            setIsLoading(true);
            setError(null);
            fetchExecutions().finally(() => setIsLoading(false));
        } else {
            // Reset state when modal closes
            setExecutions([]);
            setError(null);
            setIsPolling(false);
        }
    }, [isOpen, taskId]);

    // Set up polling effect
    useEffect(() => {
        if (!isOpen || !isPolling) return;

        console.log(`[TaskExecutionModal] Starting execution polling interval`);
        const pollInterval = setInterval(() => {
            fetchExecutions();
        }, 2000); // Poll every 2 seconds

        return () => {
            console.log(`[TaskExecutionModal] Cleaning up polling interval`);
            clearInterval(pollInterval);
        };
    }, [isOpen, isPolling, taskId]);

    const getStatusIcon = (status: TaskExecution['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircleIcon className="h-4 w-4 text-red-500" />;
            default:
                return <ArrowPathIcon className="h-4 w-4 text-blue-600 animate-spin" />;
        }
    };

    const getStatusClass = (status: TaskExecution['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-zinc-100 text-zinc-800';
        }
    };

    const formatOutput = (output: Record<string, any> | null) => {
        if (!output) return null;

        // Handle array outputs
        if (Array.isArray(output)) {
            return `[${output.join(', ')}]`;
        }

        // Handle object outputs
        const properties = outputSchema.properties || {};
        const columns = Object.keys(properties);

        if (columns.length === 0) {
            return JSON.stringify(output);
        }

        return JSON.stringify(output);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Execution History</DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[600px]">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-zinc-50 rounded-lg p-4 animate-pulse">
                                    <div className="h-4 bg-zinc-200 rounded w-1/4 mb-2"></div>
                                    <div className="h-3 bg-zinc-200 rounded w-1/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            {error.message}
                        </div>
                    ) : executions.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            No executions found
                        </div>
                    ) : (
                        <div className="relative">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead>Output</TableHead>
                                        <TableHead className="w-[200px]">Error</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {executions.map(execution => (
                                        <TableRow key={execution.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(execution.status)}
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClass(execution.status)}`}>
                                                        {execution.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-zinc-500">
                                                {format(new Date(execution.created_at), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                {execution.output && (
                                                    <div className="font-mono text-sm whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                                        {formatOutput(execution.output)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {execution.error && (
                                                    <div className="text-sm text-red-600 max-h-[100px] overflow-y-auto">
                                                        {execution.error}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
} 