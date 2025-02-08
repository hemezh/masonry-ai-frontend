'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { taskService, TaskConfig, UpdateTaskConfigPayload } from '@/services/task-service';
import { Task } from '@/types/task-api';
import { SchemaFields } from '@/components/ui/schema-fields';

// Debug logging utility
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    // console.log(`[TaskConfigModal ${timestamp}] ${message}`, data || '');
};

interface TaskConfigModalProps {
    task: Task;
    configId: string;
    isOpen: boolean;
    onClose: () => void;
    onConfigUpdate: (config: TaskConfig) => void;
}

export function TaskConfigModal({ task, configId, isOpen, onClose, onConfigUpdate }: TaskConfigModalProps) {
    log('Initializing TaskConfigModal', { taskId: task.id, configId });

    const [isLoading, setIsLoading] = useState(false);
    const [values, setValues] = useState<Record<string, any>>({});
    const { toast } = useToast();

    // Fetch current config when modal opens
    useEffect(() => {
        if (isOpen && configId) {
            log('Fetching config', { configId });
            setIsLoading(true);
            taskService.getTaskConfig(configId)
                .then(config => {
                    log('Config fetched successfully', config);
                    setValues(config.values || {});
                })
                .catch(error => {
                    log('Error fetching config', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to load configuration',
                        variant: 'destructive',
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, configId, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        log('Submitting config update', { values });
        setIsLoading(true);
        
        try {
            const updatedConfig = await taskService.updateTaskConfig(configId, {
                values
            } as UpdateTaskConfigPayload);
            log('Config updated successfully', updatedConfig);
            onConfigUpdate(updatedConfig);
            toast({
                title: 'Success',
                description: 'Configuration updated successfully',
            });
            onClose();
        } catch (error) {
            log('Error updating config', error);
            toast({
                title: 'Error',
                description: 'Failed to update configuration',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Configure {task.name}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <SchemaFields
                            values={values}
                            onChange={setValues}
                            schema={task.config_schema}
                        />
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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 