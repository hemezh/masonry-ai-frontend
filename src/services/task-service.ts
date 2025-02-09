import { apiClient } from '@/lib/api-client';
import { Task, CreateTaskPayload, UpdateTaskPayload, TaskExecution, ExecuteTaskPayload } from '@/types/task-api';
import axios, { AxiosError } from 'axios';

class TaskService {
    private baseUrl = '/tasks';

    async listTasks(status?: Task['status'], signal?: AbortSignal): Promise<Task[]> {
        try {
            const response = await apiClient.get<{ data: Task[] }>(this.baseUrl, {
                params: { status },
                signal
            });
            return response.data.data;
        } catch (error) {
            if (axios.isCancel(error)) {
                return [];
            }
            throw error;
        }
    }

    async getTask(id: string, signal?: AbortSignal): Promise<Task> {
        try {
            const response = await apiClient.get<{ data: Task }>(`${this.baseUrl}/${id}`, {
                signal
            });
            return response.data.data;
        } catch (error) {
            if (axios.isCancel(error)) {
                throw new Error('Request cancelled');
            }
            throw error;
        }
    }

    async createTask(payload: CreateTaskPayload): Promise<Task> {
        const response = await apiClient.post<{ data: Task }>(this.baseUrl, payload);
        return response.data.data;
    }

    async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
        const response = await apiClient.put<{ data: Task }>(`${this.baseUrl}/${id}`, payload);
        return response.data.data;
    }

    async deleteTask(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
    }

    async createTaskConfig(taskId: string, payload: UpdateTaskConfigPayload): Promise<TaskConfig> {
        console.log(`Creating task config for task ${taskId} with values:`, payload);
        try {
            const response = await apiClient.post<TaskConfig>(`${this.baseUrl}/${taskId}/config`, payload);
            console.log(`Successfully created task config for task ${taskId}:`, response.data);
            return response.data;
        } catch (error) {
            console.log(`Error creating task config for task ${taskId}:`, error);
            throw error;
        }
    }

    async getTaskConfig(taskId: string): Promise<TaskConfig> {
        console.log(`Getting task config for task ${taskId}`);
        try {
            const response = await apiClient.get<TaskConfig>(`${this.baseUrl}/${taskId}/config`);
            console.log(`Successfully retrieved task config for task ${taskId}:`, response.data);
            return response.data;
        } catch (error) {
            console.log(`Error getting task config for task ${taskId}:`, error);
            throw error;
        }
    }

    async updateTaskConfig(taskId: string, payload: UpdateTaskConfigPayload): Promise<TaskConfig> {
        console.log(`Updating task config for task ${taskId} with values:`, payload);
        try {
            const response = await apiClient.put<TaskConfig>(`${this.baseUrl}/${taskId}/config`, payload);
            console.log(`Successfully updated task config for task ${taskId}:`, response.data);
            return response.data;
        } catch (error) {
            console.log(`Error updating task config for task ${taskId}:`, error);
            throw error;
        }
    }

    async createOrUpdateTaskConfig(taskId: string, values: Record<string, any>): Promise<TaskConfig> {
        console.log(`Attempting to create or update task config for task ${taskId} with values:`, values);
        const payload: UpdateTaskConfigPayload = { values };
        
        try {
            // First try to get existing config
            console.log(`Checking for existing config for task ${taskId}`);
            try {
                await this.getTaskConfig(taskId);
                console.log(`Found existing config for task ${taskId}, updating...`);
                // If config exists, update it
                return await this.updateTaskConfig(taskId, payload);
            } catch (error) {
                // Check if error is 404 Not Found
                if (error instanceof AxiosError && error.response?.status === 404) {
                    console.log(`No existing config found for task ${taskId}, creating new config...`);
                    // If config doesn't exist, create new one
                    return await this.createTaskConfig(taskId, payload);
                }
                throw error; // Re-throw if it's not a 404
            }
        } catch (error) {
            console.log(`Error in createOrUpdateTaskConfig for task ${taskId}:`, error);
            throw error;
        }
    }

    async deleteTaskConfig(taskId: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${taskId}/config`);
    }

    async executeTask(taskId: string, payload: ExecuteTaskPayload): Promise<TaskExecution> {
        const response = await apiClient.post<{
            success: boolean;
            output: Record<string, any>;
            start_time: string;
            end_time: string;
        }>(`${this.baseUrl}/${taskId}/execute`, payload);

        // Transform the response into a TaskExecution object
        const execution: TaskExecution = {
            id: crypto.randomUUID(), // Generate a unique ID since the API doesn't provide one
            task_id: taskId,
            input: payload.input,
            config: payload.config,
            status: 'completed', // Since we got a response, it's completed
            output: response.data.output,
            started_at: response.data.start_time,
            completed_at: response.data.end_time,
            created_at: response.data.start_time,
            updated_at: response.data.end_time
        };

        return execution;
    }

    async listTaskExecutions(taskId: string): Promise<TaskExecution[]> {
        const response = await apiClient.get<{ data: TaskExecution[] }>(`${this.baseUrl}/${taskId}/executions`);
        return response.data.data;
    }

    async getExecution(executionId: string): Promise<TaskExecution> {
        const response = await apiClient.get<{ data: TaskExecution }>(`${this.baseUrl}/executions/${executionId}`);
        return response.data.data;
    }
}

export interface TaskConfig {
    id: string;
    task_id: string;
    values: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface UpdateTaskConfigPayload {
    values: Record<string, any>;
}

export const taskService = new TaskService(); 