export interface Task {
    id: string;
    name: string;
    description: string;
    code: string;
    dependencies: string[];
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
    config_schema: Record<string, any>;
    status: 'Draft' | 'Active' | 'Archived';
    created_at: string;
    updated_at: string;
}

export interface CreateTaskPayload {
    name: string;
    description: string;
    code: string;
    dependencies: string[];
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
    config_schema: Record<string, any>;
    status: Task['status'];
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface TaskExecution {
    id: string;
    task_id: string;
    input: Record<string, any>;
    config: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
    output?: Record<string, any>;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ExecuteTaskPayload {
    input: Record<string, any>;
    config: Record<string, any>;
} 