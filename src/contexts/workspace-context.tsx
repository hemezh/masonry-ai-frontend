'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workspace, WorkspaceMember } from '@/types/workspace';
import { workspaceService } from '@/services/workspace-service';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './auth-context';

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    members: WorkspaceMember[];
    isLoading: boolean;
    error: string | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
    refreshWorkspaces: () => Promise<void>;
    createWorkspace: (name: string, description: string) => Promise<Workspace>;
    updateWorkspace: (id: string, name: string, description: string) => Promise<Workspace>;
    deleteWorkspace: (id: string) => Promise<void>;
    inviteMember: (workspaceId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
    removeMember: (workspaceId: string, userId: string) => Promise<void>;
    updateMemberRole: (workspaceId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleError = (error: Error) => {
        setError(error.message);
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
    };

    const refreshWorkspaces = async () => {
        try {
            setIsLoading(true);
            const workspaceList = await workspaceService.listWorkspaces();
            setWorkspaces(workspaceList);
            
            // Set first workspace as current if none selected
            if (!currentWorkspace && workspaceList.length > 0) {
                setCurrentWorkspace(workspaceList[0]);
            }
        } catch (error) {
            handleError(error as Error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshMembers = async (workspaceId: string) => {
        try {
            const memberList = await workspaceService.listMembers(workspaceId);
            setMembers(memberList);
        } catch (error) {
            handleError(error as Error);
        }
    };

    useEffect(() => {
        if (user) {
            refreshWorkspaces();
        }
    }, [user]);

    useEffect(() => {
        if (currentWorkspace) {
            refreshMembers(currentWorkspace.id);
        }
    }, [currentWorkspace]);

    const createWorkspace = async (name: string, description: string) => {
        try {
            const workspace = await workspaceService.createWorkspace({ name, description });
            await refreshWorkspaces();
            toast({
                title: "Success",
                description: "Workspace created successfully",
            });
            return workspace;
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    const updateWorkspace = async (id: string, name: string, description: string) => {
        try {
            const workspace = await workspaceService.updateWorkspace(id, { name, description });
            await refreshWorkspaces();
            toast({
                title: "Success",
                description: "Workspace updated successfully",
            });
            return workspace;
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    const deleteWorkspace = async (id: string) => {
        try {
            await workspaceService.deleteWorkspace(id);
            await refreshWorkspaces();
            toast({
                title: "Success",
                description: "Workspace deleted successfully",
            });
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    const inviteMember = async (workspaceId: string, userId: string, role: 'admin' | 'member') => {
        try {
            await workspaceService.inviteMember(workspaceId, { user_id: userId, role });
            await refreshMembers(workspaceId);
            toast({
                title: "Success",
                description: "Member invited successfully",
            });
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    const removeMember = async (workspaceId: string, userId: string) => {
        try {
            await workspaceService.removeMember(workspaceId, userId);
            await refreshMembers(workspaceId);
            toast({
                title: "Success",
                description: "Member removed successfully",
            });
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    const updateMemberRole = async (workspaceId: string, userId: string, role: 'admin' | 'member') => {
        try {
            await workspaceService.updateMemberRole(workspaceId, userId, { role });
            await refreshMembers(workspaceId);
            toast({
                title: "Success",
                description: "Member role updated successfully",
            });
        } catch (error) {
            handleError(error as Error);
            throw error;
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                members,
                isLoading,
                error,
                setCurrentWorkspace,
                refreshWorkspaces,
                createWorkspace,
                updateWorkspace,
                deleteWorkspace,
                inviteMember,
                removeMember,
                updateMemberRole,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
} 