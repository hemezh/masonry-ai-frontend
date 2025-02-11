export type Role = 'admin' | 'member';

export interface Workspace {
    id: string;
    name: string;
    description: string;
    is_personal: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: Role;
    invited_by: string;
    status: 'active' | 'pending' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface CreateWorkspaceDto {
    name: string;
    description: string;
}

export interface UpdateWorkspaceDto {
    name: string;
    description: string;
}

export interface InviteMemberDto {
    user_id: string;
    role: Role;
}

export interface UpdateMemberRoleDto {
    role: Role;
}

export type WorkspaceError = {
    error: string;
}; 