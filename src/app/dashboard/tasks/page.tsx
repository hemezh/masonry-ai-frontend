'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTask } from '@/hooks/use-task';
import { Task } from '@/types/task-api';
import { TaskConfigModal } from '@/components/task/task-config-modal';
import { TaskConfig } from '@/services/task-service';
import { TaskHeader } from '@/components/task/task-header';
import { TaskFilters } from '@/components/task/task-filters';
import { TaskList } from '@/components/task/task-list';
import { TaskEmptyState } from '@/components/task/task-empty-state';

// Debug logging utility
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[TasksPage ${timestamp}] ${message}`, data || '');
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const fetchCount = useRef(0);
    const strictModeRender = useRef(false);
    
    const { 
        isLoading,
        listTasks,
        deleteTask
    } = useTask({
        onError: (error) => {
            log('Task operation error:', error);
        }
    });

    const fetchTasks = useCallback(async () => {
        const currentFetchCount = ++fetchCount.current;
        log(`Starting fetch #${currentFetchCount}. Status filter:`, statusFilter);

        try {
            const fetchedTasks = await listTasks(statusFilter === 'all' ? undefined : statusFilter);
            if (currentFetchCount === fetchCount.current) {
                setTasks(fetchedTasks || []);
            }
        } catch (error) {
            log(`Fetch #${currentFetchCount} failed:`, error);
        }
    }, [listTasks, statusFilter]);

    useEffect(() => {
        if (strictModeRender.current) {
            return;
        }
        strictModeRender.current = true;
        fetchTasks();
    }, [fetchTasks]);

    const handleDelete = async (taskId: string) => {
        const success = await deleteTask(taskId);
        if (success) {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        }
    };

    const handleConfigUpdate = (config: TaskConfig) => {
        log('Task configuration updated:', config);
        // Optionally refresh tasks if needed
        fetchTasks();
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="p-8 mx-auto">
                <TaskHeader />
                <TaskFilters 
                    statusFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <TaskList
                        tasks={tasks}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onConfigureClick={setSelectedTask}
                    />
                </div>
                {!isLoading && tasks.length === 0 && (
                    <TaskEmptyState statusFilter={statusFilter} />
                )}
                {selectedTask && (
                    <TaskConfigModal
                        task={selectedTask}
                        isOpen={true}
                        onClose={() => setSelectedTask(null)}
                        onConfigUpdate={handleConfigUpdate}
                    />
                )}
            </div>
        </div>
    );
} 