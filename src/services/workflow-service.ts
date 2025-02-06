import { apiClient } from '@/lib/api-client';
import { Workflow, WorkflowResponse } from '@/types/workflow-api';

export class WorkflowService {
  static async getWorkflow(chatId: string): Promise<Workflow> {
    const response = await apiClient.get<WorkflowResponse>(`/workflows/${chatId}`);
    return response.data.data;
  }
} 