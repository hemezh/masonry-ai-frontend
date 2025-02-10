import { 
    Workspace, 
    WorkspaceMember, 
    CreateWorkspaceDto, 
    UpdateWorkspaceDto, 
    InviteMemberDto, 
    UpdateMemberRoleDto,
} from '@/types/workspace';
import { apiClient } from '@/lib/api-client';
import { AxiosResponse } from 'axios';

class WorkspaceService {
    private BASE_PATH = '/workspaces';

    // Workspace Operations
    async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
        const response = await apiClient.post<Workspace>(this.BASE_PATH, data);
        return response.data;
    }

    async getWorkspace(id: string): Promise<Workspace> {
        const response = await apiClient.get<Workspace>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    async updateWorkspace(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
        const response = await apiClient.put<Workspace>(`${this.BASE_PATH}/${id}`, data);
        return response.data;
    }

    async deleteWorkspace(id: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${id}`);
    }

    async listWorkspaces(): Promise<Workspace[]> {
        const response = await apiClient.get<Workspace[]>(this.BASE_PATH);
        return response.data;
    }

    // Member Management
    async inviteMember(workspaceId: string, data: InviteMemberDto): Promise<void> {
        await apiClient.post(`${this.BASE_PATH}/${workspaceId}/members`, data);
    }

    async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
        const response = await apiClient.get<WorkspaceMember[]>(`${this.BASE_PATH}/${workspaceId}/members`);
        return response.data;
    }

    async updateMemberRole(workspaceId: string, userId: string, data: UpdateMemberRoleDto): Promise<void> {
        await apiClient.put(`${this.BASE_PATH}/${workspaceId}/members/${userId}/role`, data);
    }

    async removeMember(workspaceId: string, userId: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${workspaceId}/members/${userId}`);
    }

    // Invitation Management
    async acceptInvitation(workspaceId: string): Promise<void> {
        await apiClient.post(`${this.BASE_PATH}/${workspaceId}/invitations/accept`);
    }

    async rejectInvitation(workspaceId: string): Promise<void> {
        await apiClient.post(`${this.BASE_PATH}/${workspaceId}/invitations/reject`);
    }
}

export const workspaceService = new WorkspaceService(); 