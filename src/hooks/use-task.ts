import { useState, useCallback, useRef } from 'react';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '@/types/task-api';
import { taskService } from '@/services/task-service';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface UseTaskOptions {
    onError?: (error: Error) => void;
}

export function useTask(options: UseTaskOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();
    const cancelRef = useRef<AbortController | null>(null);

    const handleError = useCallback((error: unknown) => {
        if (axios.isCancel(error)) {
            return; // Don't show error toast for cancelled requests
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(error instanceof Error ? error : new Error(errorMessage));
        options.onError?.(error instanceof Error ? error : new Error(errorMessage));
        toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
        });
    }, [options.onError, toast]);

    const listTasks = useCallback(async (status?: Task['status']) => {
        // Cancel any in-flight request
        if (cancelRef.current) {
            cancelRef.current.abort();
        }
        
        // Create new cancel token
        cancelRef.current = new AbortController();
        
        setIsLoading(true);
        setError(null);
        
        try {
            const tasks = await taskService.listTasks(status, cancelRef.current.signal);
            return tasks;
        } catch (error) {
            handleError(error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const getTask = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const task = await taskService.getTask(id);
            return task;
        } catch (error) {
            handleError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const createTask = useCallback(async (payload: CreateTaskPayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const task = await taskService.createTask(payload);
            toast({
                title: 'Success',
                description: 'Task created successfully',
            });
            return task;
        } catch (error) {
            handleError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, toast]);

    const updateTask = useCallback(async (id: string, payload: UpdateTaskPayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const task = await taskService.updateTask(id, payload);
            toast({
                title: 'Success',
                description: 'Task updated successfully',
            });
            return task;
        } catch (error) {
            handleError(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, toast]);

    const deleteTask = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await taskService.deleteTask(id);
            toast({
                title: 'Success',
                description: 'Task deleted successfully',
            });
            return true;
        } catch (error) {
            handleError(error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [handleError, toast]);

    return {
        isLoading,
        error,
        listTasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
    };
} 