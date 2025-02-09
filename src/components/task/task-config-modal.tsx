'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { taskService, TaskConfig } from '@/services/task-service';
import { Task } from '@/types/task-api';
import { SchemaFields } from '@/components/ui/schema-fields';

// Debug logging utility
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    // console.log(`[TaskConfigModal ${timestamp}] ${message}`, data || '');
};

interface TaskConfigModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onConfigUpdate: (config: TaskConfig) => void;
}

export function TaskConfigModal({ task, isOpen, onClose, onConfigUpdate }: TaskConfigModalProps) {
    log('Initializing TaskConfigModal', { taskId: task.id });

    const [isLoading, setIsLoading] = useState(false);
    const [values, setValues] = useState<Record<string, any>>({});
    const { toast } = useToast();

    // Load existing config when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setIsLoading(true);

        taskService.getTaskConfig(task.id)
            .then(config => {
                if (!isMounted) return;
                // Set the values from the config
                setValues(config.values);
            })
            .catch((error) => {
                // If no config exists or error occurs, start with empty values
                if (!isMounted) return;
                if (error?.response?.status === 404) {
                    console.log('No existing config found, starting with empty values');
                } else {
                    console.error('Error loading config:', error);
                }
                setValues({});
            })
            .finally(() => {
                if (!isMounted) return;
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, task.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const config = await taskService.createOrUpdateTaskConfig(task.id, values);
            onConfigUpdate(config);
            toast({ title: 'Success', description: 'Configuration saved successfully' });
            onClose();
        } catch (error) {
            console.error('Error saving config:', error);
            toast({
                title: 'Error',
                description: 'Failed to save configuration',
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