import { apiClient } from '@/lib/api-client';
import { Task, CreateTaskPayload, UpdateTaskPayload, TaskExecution, ExecuteTaskPayload } from '@/types/task-api';
import axios from 'axios';

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

    async getTaskConfig(configId: string): Promise<TaskConfig> {
        const response = await apiClient.get<{ data: TaskConfig }>(`${this.baseUrl}/config/${configId}`);
        return response.data.data;
    }

    async updateTaskConfig(configId: string, payload: UpdateTaskConfigPayload): Promise<TaskConfig> {
        const response = await apiClient.put<{ data: TaskConfig }>(`${this.baseUrl}/config/${configId}`, payload);
        return response.data.data;
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
    name: string;
    description: string;
    values: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface UpdateTaskConfigPayload {
    name: string;
    description: string;
    values: Record<string, any>;
}

export const taskService = new TaskService(); 