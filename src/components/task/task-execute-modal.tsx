'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task, TaskExecution } from '@/types/task-api';
import { taskService } from '@/services/task-service';
import { useToast } from '@/hooks/use-toast';
import { SchemaFields } from '@/components/ui/schema-fields';

interface TaskExecuteModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onExecuted: (execution: TaskExecution) => void;
}

export function TaskExecuteModal({ task, isOpen, onClose, onExecuted }: TaskExecuteModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState<Record<string, any>>({});
    const { toast } = useToast();

    // Check if the task requires input
    const requiresInput = task.input_schema?.properties && Object.keys(task.input_schema.properties).length > 0;

    const executeTask = async () => {
        console.log(`[TaskExecuteModal] executeTask called for task: ${task.id}`);
        console.log(`[TaskExecuteModal] Input provided:`, input);
        setIsLoading(true);
        try {
            console.log(`[TaskExecuteModal] Calling taskService.executeTask for task: ${task.id}`);
            const execution = await taskService.executeTask(task.id, {
                input,
                config: {} // Use existing config
            });
            console.log(`[TaskExecuteModal] Received execution response:`, execution);
            if (!execution) {
                throw new Error('Task execution failed: Received undefined response from taskService.');
            }

            onExecuted(execution);
            toast({
                title: 'Success',
                description: 'Task execution started successfully',
            });
            console.log(`[TaskExecuteModal] Executed task successfully, closing modal.`);
            onClose();
        } catch (error) {
            console.error(`[TaskExecuteModal] Task execution failed for task: ${task.id}`, error);
            toast({
                title: 'Error',
                description: 'Failed to execute task',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            console.log(`[TaskExecuteModal] Task execution flow finished for task: ${task.id}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(`[TaskExecuteModal] Form submission triggered for task: ${task.id}`);
        await executeTask();
    };

    // Auto-execute if no input is required
    useEffect(() => {
        if (isOpen && !requiresInput && !isLoading) {
            console.log(`[TaskExecuteModal] Auto-executing task ${task.id} as no input is required.`);
            executeTask();
        }
    }, [isOpen, requiresInput]);

    // Don't render the modal if no input is required
    if (!requiresInput) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Execute Task: {task.name}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Input</h3>
                                <SchemaFields
                                    values={input}
                                    onChange={setInput}
                                    schema={task.input_schema}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            Execute
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 